import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout, PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Lightbulb, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContextBadge } from "@/components/chat/ContextBadge";
import { useChatStream, type ChatStreamMessage } from "@/lib/streaming/useChatStream";
import { useChatSessions, useChatMessages } from "@/lib/queries/chatSessions";
import { useTailoringJobs } from "@/lib/queries/tailoringJobs";
import { useResumes } from "@/lib/queries/resumes";

const suggestedPrompts = [
  "Review my resume summary",
  "What skills should I highlight for this job?",
  "Rewrite this bullet with impact",
  "What interview questions should I prepare for?",
];

const WELCOME: ChatStreamMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm your AI career assistant. I can help with resume advice, job search strategy, and interview prep. For tailored guidance, open me from a tailored resume.",
};

export default function Chatbot() {
  const [params] = useSearchParams();
  const tailoringJobId = params.get("tailoring_job_id");

  const { data: sessions, isLoading: sessionsLoading } = useChatSessions();
  const { data: jobs } = useTailoringJobs();
  const { data: resumes } = useResumes();

  const job = useMemo(
    () => (tailoringJobId ? jobs?.find((j) => j.id === tailoringJobId) ?? null : null),
    [tailoringJobId, jobs],
  );
  const resumeLabel = useMemo(
    () => (job ? resumes?.find((r) => r.id === job.base_resume_id)?.label ?? null : null),
    [job, resumes],
  );

  // Reuse an existing session: the one tied to this job, or the latest
  // general (no-context) session. The edge function continues whichever
  // session id we pass, so server-side history stays coherent.
  const targetSession = useMemo(() => {
    if (!sessions) return null;
    return tailoringJobId
      ? sessions.find((s) => s.tailoring_job_id === tailoringJobId) ?? null
      : sessions.find((s) => !s.tailoring_job_id) ?? null;
  }, [sessions, tailoringJobId]);

  const { data: history } = useChatMessages(targetSession?.id);

  const ready = !sessionsLoading && (!targetSession || history !== undefined);

  if (!ready) {
    return (
      <Layout>
        <div className="page-container section-spacing">
          <PageHeader
            title="AI Career Assistant"
            description="Get personalized guidance on resume writing, job search, and interview preparation."
          />
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      </Layout>
    );
  }

  const seeded: ChatStreamMessage[] =
    history && history.length > 0
      ? history.map((m) => ({
          id: m.id,
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        }))
      : [WELCOME];

  return (
    <ChatPanel
      key={targetSession?.id ?? tailoringJobId ?? "general"}
      sessionId={targetSession?.id ?? null}
      tailoringJobId={tailoringJobId}
      initialMessages={seeded}
      resumeLabel={resumeLabel}
      roleTitle={job?.role_title ?? null}
      companyName={job?.company_name ?? null}
    />
  );
}

type ChatPanelProps = {
  sessionId: string | null;
  tailoringJobId: string | null;
  initialMessages: ChatStreamMessage[];
  resumeLabel: string | null;
  roleTitle: string | null;
  companyName: string | null;
};

function ChatPanel({
  sessionId,
  tailoringJobId,
  initialMessages,
  resumeLabel,
  roleTitle,
  companyName,
}: ChatPanelProps) {
  const { messages, isStreaming, rateLimited, sendMessage } = useChatStream({
    sessionId,
    tailoringJobId,
    initialMessages,
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input;
    setInput("");
    void sendMessage(text);
  };

  // The last user message content, for retrying a dropped response.
  const lastUserContent = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") return messages[i].content;
    }
    return "";
  }, [messages]);

  const inputDisabled = isStreaming || rateLimited;

  return (
    <Layout>
      <div className="page-container section-spacing">
        <PageHeader
          title="AI Career Assistant"
          description="Get personalized guidance on resume writing, job search, and interview preparation."
          helperText="Tip: open this from a tailored resume for advice grounded in your application."
        />

        <div className="grid lg:grid-cols-[280px_1fr] gap-6 max-w-5xl mx-auto">
          {/* Sidebar - Suggested Prompts */}
          <div className="hidden lg:block">
            <div className="bg-card border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Suggested Prompts</h3>
              </div>
              <div className="space-y-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => void sendMessage(prompt)}
                    disabled={inputDisabled}
                    className="w-full text-left p-3 text-sm rounded-lg bg-muted/50 hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="bg-card border rounded-xl flex flex-col h-[600px] overflow-hidden">
            <ContextBadge
              resumeLabel={resumeLabel}
              roleTitle={roleTitle}
              companyName={companyName}
            />

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => {
                  const showTyping =
                    message.role === "assistant" && message.streaming && message.content === "";
                  return (
                    <div
                      key={message.id}
                      className={cn("flex gap-3", message.role === "user" && "flex-row-reverse")}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          message.role === "assistant"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted",
                        )}
                      >
                        {message.role === "assistant" ? (
                          <Bot className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2.5 max-w-[80%]",
                          message.role === "assistant" ? "bg-muted" : "bg-primary text-primary-foreground",
                        )}
                      >
                        {showTyping ? (
                          <div className="flex gap-1 py-1">
                            <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse" />
                            <span
                              className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse"
                              style={{ animationDelay: "0.2s" }}
                            />
                            <span
                              className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse"
                              style={{ animationDelay: "0.4s" }}
                            />
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        )}
                        {message.failed && (
                          <button
                            onClick={() => void sendMessage(lastUserContent)}
                            className="mt-2 flex items-center gap-1.5 text-xs text-destructive hover:underline"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Connection lost — tap to retry
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Mobile Prompts */}
            <div className="lg:hidden px-4 pb-2">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => void sendMessage(prompt)}
                    disabled={inputDisabled}
                    className="shrink-0 px-3 py-1.5 text-xs rounded-full bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder={
                    rateLimited ? "Daily chat limit reached — try again tomorrow" : "Type your message…"
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={inputDisabled}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!input.trim() || inputDisabled}>
                  {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
