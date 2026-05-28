// Llama provider adapter for Groq (primary) + Together AI (failover).
//
// Failure semantics:
//   - 1st 429 -> retry once after `Retry-After` header (or 2s if absent).
//   - 2nd 429 within the same call:
//       - if opts.fallback && TOGETHER_API_KEY -> retry once on Together AI
//         with the model name remapped per TOGETHER_MODEL_MAP
//       - otherwise throw AIUnavailableError ({ code: 'ai_unavailable' })
//   - 1st 5xx -> retry once after 1s.
//   - 2nd 5xx -> throw AIUnavailableError.
//   - Any non-2xx after the retry budget -> throw Error (provider-level).
//
// Records which provider answered in the return value's `provider` field so
// the caller can persist it onto the resulting row's `model` column as e.g.
// `groq:llama-3.3-70b-versatile` vs `together:meta-llama/Llama-3.3-70B-Instruct-Turbo`.

export const LLAMA_70B = "llama-3.3-70b-versatile";
export const LLAMA_8B = "llama-3.1-8b-instant";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TOGETHER_URL = "https://api.together.xyz/v1/chat/completions";

// When falling back to Together AI, map our (Groq) model id to the equivalent
// Together AI model id. Add to this map whenever a new model is introduced.
const TOGETHER_MODEL_MAP: Record<string, string> = {
  [LLAMA_70B]: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
  [LLAMA_8B]: "meta-llama/Llama-3.1-8B-Instruct-Turbo",
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatCompletionOptions = {
  model: string;
  messages: ChatMessage[];
  /** When true, request `response_format: { type: 'json_object' }`. */
  json?: boolean;
  /** When true, allow Together AI failover on a sustained 429. */
  fallback?: boolean;
  /** Defaults to 0.2 — low for tailoring/scoring; chat callers should pass 0.7. */
  temperature?: number;
  /** Optional max output tokens. */
  maxTokens?: number;
};

export type ChatCompletionResult = {
  content: string;
  provider: "groq" | "together";
  model: string;
};

export class AIUnavailableError extends Error {
  readonly code = "ai_unavailable" as const;
  constructor(message = "AI provider is over capacity. Try again shortly.") {
    super(message);
    this.name = "AIUnavailableError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfter(response: Response, defaultMs = 2000): number {
  const header = response.headers.get("Retry-After");
  if (!header) return defaultMs;
  const secs = Number.parseFloat(header);
  if (Number.isFinite(secs)) return Math.max(0, secs * 1000);
  // Could be an HTTP-date; fall back rather than attempt to parse.
  return defaultMs;
}

type RawResponse = { response: Response; bodyText: string };

async function callOnce(
  url: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  json: boolean,
  temperature: number,
  maxTokens: number | undefined,
): Promise<RawResponse> {
  const body: Record<string, unknown> = { model, messages, temperature };
  if (maxTokens !== undefined) body.max_tokens = maxTokens;
  if (json) body.response_format = { type: "json_object" };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  const bodyText = await response.text();
  return { response, bodyText };
}

function extractContent(bodyText: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    throw new Error("Provider returned non-JSON body");
  }
  const root = parsed as { choices?: Array<{ message?: { content?: unknown } }> };
  const content = root.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Unexpected provider response shape: missing choices[0].message.content");
  }
  return content;
}

export async function chatCompletion(
  opts: ChatCompletionOptions,
): Promise<ChatCompletionResult> {
  const groqKey = Deno.env.get("GROQ_API_KEY");
  if (!groqKey) throw new Error("GROQ_API_KEY is not set");
  const togetherKey = Deno.env.get("TOGETHER_API_KEY") ?? "";

  const temperature = opts.temperature ?? 0.2;
  const json = !!opts.json;

  // ── Attempt 1: Groq ────────────────────────────────────────────────
  let raw = await callOnce(
    GROQ_URL,
    groqKey,
    opts.model,
    opts.messages,
    json,
    temperature,
    opts.maxTokens,
  );

  // ── 429 handling ───────────────────────────────────────────────────
  if (raw.response.status === 429) {
    await sleep(parseRetryAfter(raw.response));
    raw = await callOnce(
      GROQ_URL,
      groqKey,
      opts.model,
      opts.messages,
      json,
      temperature,
      opts.maxTokens,
    );

    if (raw.response.status === 429) {
      if (opts.fallback && togetherKey) {
        const togetherModel = TOGETHER_MODEL_MAP[opts.model] ?? opts.model;
        const tRaw = await callOnce(
          TOGETHER_URL,
          togetherKey,
          togetherModel,
          opts.messages,
          json,
          temperature,
          opts.maxTokens,
        );
        if (tRaw.response.ok) {
          return {
            content: extractContent(tRaw.bodyText),
            provider: "together",
            model: togetherModel,
          };
        }
      }
      throw new AIUnavailableError();
    }
  }

  // ── 5xx handling ───────────────────────────────────────────────────
  if (raw.response.status >= 500) {
    await sleep(1000);
    raw = await callOnce(
      GROQ_URL,
      groqKey,
      opts.model,
      opts.messages,
      json,
      temperature,
      opts.maxTokens,
    );
    if (raw.response.status >= 500) {
      throw new AIUnavailableError("AI provider failed. Try again shortly.");
    }
  }

  if (!raw.response.ok) {
    throw new Error(
      `Provider error ${raw.response.status}: ${raw.bodyText.slice(0, 500)}`,
    );
  }

  return {
    content: extractContent(raw.bodyText),
    provider: "groq",
    model: opts.model,
  };
}

// ── Streaming ───────────────────────────────────────────────────────────
// Used by the chat function. Same provider/failover semantics as the
// buffered path, but returns a ReadableStream of content tokens once an OK
// streaming response is open. Token parsing (OpenAI-style SSE) is done here
// so callers only deal with plain strings.

export type StreamCompletionResult = {
  tokens: ReadableStream<string>;
  provider: "groq" | "together";
  model: string;
};

async function openStream(
  url: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number | undefined,
): Promise<Response> {
  const body: Record<string, unknown> = { model, messages, temperature, stream: true };
  if (maxTokens !== undefined) body.max_tokens = maxTokens;
  return await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
}

/** Parses an OpenAI-style SSE response body into a stream of content tokens. */
function sseToTokens(response: Response): ReadableStream<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  return new ReadableStream<string>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      for (const ev of events) {
        const line = ev.split("\n").find((l) => l.startsWith("data:"));
        if (!line) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") {
          controller.close();
          return;
        }
        try {
          const json = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: unknown } }>;
          };
          const delta = json.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta.length > 0) {
            controller.enqueue(delta);
          }
        } catch {
          // Ignore keep-alive comments / malformed partial lines.
        }
      }
    },
    cancel() {
      void reader.cancel();
    },
  });
}

export async function streamChatCompletion(
  opts: ChatCompletionOptions,
): Promise<StreamCompletionResult> {
  const groqKey = Deno.env.get("GROQ_API_KEY");
  if (!groqKey) throw new Error("GROQ_API_KEY is not set");
  const togetherKey = Deno.env.get("TOGETHER_API_KEY") ?? "";

  const temperature = opts.temperature ?? 0.7;

  let resp = await openStream(
    GROQ_URL,
    groqKey,
    opts.model,
    opts.messages,
    temperature,
    opts.maxTokens,
  );

  if (resp.status === 429) {
    await sleep(parseRetryAfter(resp));
    resp = await openStream(GROQ_URL, groqKey, opts.model, opts.messages, temperature, opts.maxTokens);
    if (resp.status === 429) {
      if (opts.fallback && togetherKey) {
        const togetherModel = TOGETHER_MODEL_MAP[opts.model] ?? opts.model;
        const tResp = await openStream(
          TOGETHER_URL,
          togetherKey,
          togetherModel,
          opts.messages,
          temperature,
          opts.maxTokens,
        );
        if (tResp.ok) {
          return { tokens: sseToTokens(tResp), provider: "together", model: togetherModel };
        }
      }
      throw new AIUnavailableError();
    }
  }

  if (resp.status >= 500) {
    await sleep(1000);
    resp = await openStream(GROQ_URL, groqKey, opts.model, opts.messages, temperature, opts.maxTokens);
    if (resp.status >= 500) {
      throw new AIUnavailableError("AI provider failed. Try again shortly.");
    }
  }

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Provider error ${resp.status}: ${text.slice(0, 500)}`);
  }

  return { tokens: sseToTokens(resp), provider: "groq", model: opts.model };
}
