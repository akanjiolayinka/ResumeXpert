import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

export type ChatSession = Database["public"]["Tables"]["chat_sessions"]["Row"];
export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];

export const chatSessionKeys = {
  all: ["chat_sessions"] as const,
  lists: () => [...chatSessionKeys.all, "list"] as const,
  messages: (sessionId: string) => [...chatSessionKeys.all, "messages", sessionId] as const,
};

export function useChatSessions() {
  return useQuery({
    queryKey: chatSessionKeys.lists(),
    queryFn: async (): Promise<ChatSession[]> => {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useChatMessages(sessionId: string | null | undefined) {
  return useQuery({
    queryKey: sessionId ? chatSessionKeys.messages(sessionId) : ["chat_sessions", "messages", "noop"],
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!sessionId,
  });
}
