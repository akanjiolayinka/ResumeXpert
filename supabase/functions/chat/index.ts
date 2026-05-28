// chat (Fi6)
//
// Pipeline:
//   1. Auth (401 if no valid user). Validate ChatInputSchema.
//   2. Rate limit: count this user's role='user' chat_messages in the last
//      24h. >= MAX_CHAT_MESSAGES_PER_DAY -> 429 rate_limited.
//   3. Resolve the session:
//        - session_id given -> load it (RLS verifies ownership), 404 if not.
//        - none -> create a new chat_sessions row (linked to tailoring_job_id
//          when supplied), titled from the first message.
//   4. If the session is tied to a tailoring_job, build a system-context
//      block from the tailored resume's structured JSON (or base resume)
//      plus the job description.
//   5. Load the last 10 messages as history, then insert the user message.
//   6. Stream Llama (LLAMA_8B, chat.v1, stream + fallback) back as SSE:
//        data: {"delta":"..."}        per token
//        data: {"done":true,...}      on completion
//        data: {"error":"..."}        on mid-stream failure
//      After the stream finishes, persist the full assistant message.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { getUserFromRequest, jsonResponse } from "../_shared/client.ts";
import { streamChatCompletion, LLAMA_8B, AIUnavailableError } from "../_shared/llama.ts";
import { CHAT_SYSTEM_PROMPT, CHAT_PROMPT_VERSION } from "../_shared/prompts.ts";
import { ChatInputSchema } from "../_shared/schemas.ts";
import { MAX_CHAT_MESSAGES_PER_DAY } from "../_shared/limits.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, { status: 405, headers: corsHeaders });
  }

  const authed = await getUserFromRequest(req);
  if (!authed) {
    return jsonResponse({ error: "unauthorized" }, { status: 401, headers: corsHeaders });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, { status: 400, headers: corsHeaders });
  }

  const parsed = ChatInputSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonResponse(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400, headers: corsHeaders },
    );
  }
  const input = parsed.data;
  const userId = authed.user.id;

  // ── Rate limit ──────────────────────────────────────────────────────
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countErr } = await authed.client
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("role", "user")
    .gte("created_at", since);
  if (countErr) {
    return jsonResponse(
      { error: "rate_check_failed", detail: countErr.message },
      { status: 500, headers: corsHeaders },
    );
  }
  if ((count ?? 0) >= MAX_CHAT_MESSAGES_PER_DAY) {
    return jsonResponse(
      {
        error: "rate_limited",
        message: "You have reached your daily chat limit. Try again tomorrow.",
      },
      { status: 429, headers: corsHeaders },
    );
  }

  // ── Resolve session ─────────────────────────────────────────────────
  let sessionId: string;
  let sessionTailoringJobId: string | null;

  if (input.session_id) {
    const { data: sess, error: sErr } = await authed.client
      .from("chat_sessions")
      .select("*")
      .eq("id", input.session_id)
      .single();
    if (sErr || !sess) {
      return jsonResponse({ error: "session_not_found" }, { status: 404, headers: corsHeaders });
    }
    sessionId = sess.id;
    sessionTailoringJobId = sess.tailoring_job_id ?? input.tailoring_job_id ?? null;
  } else {
    const { data: created, error: cErr } = await authed.client
      .from("chat_sessions")
      .insert({
        user_id: userId,
        tailoring_job_id: input.tailoring_job_id ?? null,
        title: input.message.slice(0, 60),
      } as never)
      .select("*")
      .single();
    if (cErr || !created) {
      return jsonResponse(
        { error: "session_create_failed", detail: cErr?.message },
        { status: 500, headers: corsHeaders },
      );
    }
    sessionId = created.id;
    sessionTailoringJobId = created.tailoring_job_id ?? null;
  }

  // ── Build optional tailoring context ────────────────────────────────
  let contextBlock = "";
  if (sessionTailoringJobId) {
    const { data: job } = await authed.client
      .from("tailoring_jobs")
      .select("*")
      .eq("id", sessionTailoringJobId)
      .single();
    if (job) {
      let resumeRepr: unknown = null;
      if (job.tailored_resume_id) {
        const { data: tr } = await authed.client
          .from("tailored_resumes")
          .select("structured")
          .eq("id", job.tailored_resume_id)
          .single();
        resumeRepr = tr?.structured ?? null;
      }
      if (!resumeRepr) {
        const { data: base } = await authed.client
          .from("resumes")
          .select("structured, raw_text")
          .eq("id", job.base_resume_id)
          .single();
        resumeRepr = base?.structured ?? base?.raw_text ?? null;
      }
      contextBlock = [
        "SYSTEM CONTEXT (the candidate's current application):",
        `Target role: ${job.role_title ?? "unspecified"} at ${job.company_name ?? "unspecified"}`,
        `Job description:\n${job.job_description}`,
        resumeRepr
          ? `Candidate resume:\n${typeof resumeRepr === "string" ? resumeRepr : JSON.stringify(resumeRepr)}`
          : "Candidate resume: (not available)",
      ].join("\n\n");
    }
  }

  // ── Load history (before inserting the current user message) ────────
  const { data: historyRows } = await authed.client
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(10);
  const history = (historyRows ?? []).reverse();

  // ── Insert the user message ─────────────────────────────────────────
  const { error: umErr } = await authed.client
    .from("chat_messages")
    .insert({
      user_id: userId,
      session_id: sessionId,
      role: "user",
      content: input.message,
    } as never);
  if (umErr) {
    return jsonResponse(
      { error: "message_persist_failed", detail: umErr.message },
      { status: 500, headers: corsHeaders },
    );
  }

  // ── Build the LLM message array ─────────────────────────────────────
  const llmMessages = [
    { role: "system" as const, content: CHAT_SYSTEM_PROMPT },
    ...(contextBlock ? [{ role: "system" as const, content: contextBlock }] : []),
    ...history.map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    })),
    { role: "user" as const, content: input.message },
  ];

  // ── Open the upstream stream ────────────────────────────────────────
  let stream: Awaited<ReturnType<typeof streamChatCompletion>>;
  try {
    stream = await streamChatCompletion({
      model: LLAMA_8B,
      messages: llmMessages,
      temperature: 0.7,
      fallback: true,
    });
  } catch (err) {
    const message =
      err instanceof AIUnavailableError
        ? err.message
        : err instanceof Error
          ? err.message
          : "AI provider error";
    return jsonResponse(
      { error: "ai_unavailable", message },
      { status: 503, headers: corsHeaders },
    );
  }

  const providerModel = `${stream.provider}:${stream.model}`;
  const encoder = new TextEncoder();
  let full = "";

  const body = new ReadableStream({
    async start(controller) {
      const reader = stream.tokens.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += value;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: value })}\n\n`));
        }

        let assistantMessageId: string | undefined;
        if (full.trim().length > 0) {
          const { data: inserted } = await authed.client
            .from("chat_messages")
            .insert({
              user_id: userId,
              session_id: sessionId,
              role: "assistant",
              content: full,
              model: `${providerModel} (${CHAT_PROMPT_VERSION})`,
            } as never)
            .select("id")
            .single();
          assistantMessageId = inserted?.id;
          await authed.client
            .from("chat_sessions")
            .update({ updated_at: new Date().toISOString() } as never)
            .eq("id", sessionId);
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ done: true, session_id: sessionId, assistant_message_id: assistantMessageId })}\n\n`,
          ),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "stream error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});
