import { useCallback, useRef, useState } from "react";
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export type ChatRole = "user" | "assistant";

export type ChatStreamMessage = {
  id: string;
  role: ChatRole;
  content: string;
  /** True while this assistant message is still receiving tokens. */
  streaming?: boolean;
  /** Set when the stream dropped before completing — enables a retry affordance. */
  failed?: boolean;
};

type Options = {
  sessionId?: string | null;
  tailoringJobId?: string | null;
  /** Seed messages (e.g. a welcome bubble or previously persisted history). */
  initialMessages?: ChatStreamMessage[];
};

type State = {
  messages: ChatStreamMessage[];
  isStreaming: boolean;
  sessionId: string | null;
  /** True once a 429 is seen — the page disables input. */
  rateLimited: boolean;
  sendMessage: (text: string) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<ChatStreamMessage[]>>;
};

function uid(): string {
  return crypto.randomUUID();
}

/**
 * Drives the chat SSE stream. We use a raw fetch (not supabase.functions.invoke)
 * because invoke buffers the whole response — streaming needs
 * response.body.getReader(). The user message is shown optimistically; the
 * assistant bubble fills token-by-token as deltas arrive.
 */
export function useChatStream({ sessionId: initialSessionId, tailoringJobId, initialMessages }: Options): State {
  const [messages, setMessages] = useState<ChatStreamMessage[]>(initialMessages ?? []);
  const [isStreaming, setIsStreaming] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const sessionIdRef = useRef<string | null>(initialSessionId ?? null);
  const { toast } = useToast();

  const sendMessage = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || isStreaming || rateLimited) return;

      const userMsg: ChatStreamMessage = { id: uid(), role: "user", content };
      const assistantId = uid();
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: "assistant", content: "", streaming: true },
      ]);
      setIsStreaming(true);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("You are not signed in.");

        const res = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            message: content,
            session_id: sessionIdRef.current ?? undefined,
            tailoring_job_id: tailoringJobId ?? undefined,
          }),
        });

        if (res.status === 429) {
          setRateLimited(true);
          setMessages((prev) => prev.filter((m) => m.id !== assistantId && m.id !== userMsg.id));
          toast({
            title: "Daily limit reached",
            description: "You have reached today's chat limit (100 messages). Try again tomorrow.",
            variant: "destructive",
          });
          return;
        }

        if (!res.ok || !res.body) {
          let message = "Chat is unavailable right now.";
          try {
            const j = await res.json();
            message = j.message ?? j.error ?? message;
          } catch {
            /* non-JSON error body */
          }
          throw new Error(message);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let gotToken = false;

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";
          for (const ev of events) {
            const line = ev.split("\n").find((l) => l.startsWith("data:"));
            if (!line) continue;
            const payload = line.slice(5).trim();
            if (!payload) continue;
            let parsed: { delta?: string; done?: boolean; session_id?: string; error?: string };
            try {
              parsed = JSON.parse(payload);
            } catch {
              continue;
            }

            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (typeof parsed.delta === "string") {
              gotToken = true;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + parsed.delta } : m,
                ),
              );
            }
            if (parsed.done) {
              if (parsed.session_id) sessionIdRef.current = parsed.session_id;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)),
              );
            }
          }
        }

        // Stream ended without an explicit error but produced nothing / no
        // done marker — mark the bubble retryable.
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId && m.streaming
              ? { ...m, streaming: false, failed: !gotToken, content: m.content }
              : m,
          ),
        );
      } catch (err) {
        // Drop the empty assistant bubble; mark it failed so the page can show
        // "Connection lost — tap to retry".
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, streaming: false, failed: true }
              : m,
          ),
        );
        toast({
          title: "Message failed",
          description: err instanceof Error ? err.message : "Something went wrong.",
          variant: "destructive",
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, rateLimited, tailoringJobId, toast],
  );

  return {
    messages,
    isStreaming,
    sessionId: sessionIdRef.current,
    rateLimited,
    sendMessage,
    setMessages,
  };
}
