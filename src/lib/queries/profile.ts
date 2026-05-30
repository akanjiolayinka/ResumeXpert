import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const profileKeys = {
  all: ["profiles"] as const,
  me: () => [...profileKeys.all, "me"] as const,
};

/**
 * Fetches the calling user's profile row. RLS scopes the select to auth.uid()
 * so we don't need to filter by id explicitly — but the table is keyed by
 * user id, so the user always sees exactly their own row (or none, briefly,
 * right after signup before the trigger fires).
 */
export function useProfile() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: async (): Promise<Profile | null> => {
      const { data: u, error: uErr } = await supabase.auth.getUser();
      if (uErr || !u.user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.user.id)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}
