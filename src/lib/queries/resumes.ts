import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Resume } from "@/lib/types/resume";

// ── Query keys ──────────────────────────────────────────────────────────────
export const resumeKeys = {
  all: ["resumes"] as const,
  lists: () => [...resumeKeys.all, "list"] as const,
  detail: (id: string) => [...resumeKeys.all, "detail", id] as const,
};

// ── Hooks ───────────────────────────────────────────────────────────────────

export function useResumes() {
  return useQuery({
    queryKey: resumeKeys.lists(),
    queryFn: async (): Promise<Resume[]> => {
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Resume[];
    },
  });
}

type CreateResumeInput = {
  label?: string;
  raw_text: string;
  structured: unknown;
  source_kind: "upload" | "manual";
  source_storage_path?: string | null;
  source_mime?: string | null;
};

export function useCreateResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateResumeInput): Promise<Resume> => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("resumes")
        .insert({
          user_id: userData.user.id,
          label: input.label ?? "My resume",
          raw_text: input.raw_text,
          structured: input.structured as never,
          source_kind: input.source_kind,
          source_storage_path: input.source_storage_path ?? null,
          source_mime: input.source_mime ?? null,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as Resume;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: resumeKeys.lists() });
    },
  });
}

export function useDeleteResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from("resumes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: resumeKeys.lists() });
    },
  });
}

/**
 * Flip is_default on the target row. The schema has a partial unique index
 * enforcing one default per user, so we clear any existing default first.
 * Both writes are RLS-scoped to the caller.
 */
export function useSetDefaultResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { data: u, error: uErr } = await supabase.auth.getUser();
      if (uErr || !u.user) throw new Error("Not authenticated");
      const { error: clearErr } = await supabase
        .from("resumes")
        .update({ is_default: false } as never)
        .eq("user_id", u.user.id)
        .eq("is_default", true);
      if (clearErr) throw clearErr;
      const { error } = await supabase
        .from("resumes")
        .update({ is_default: true } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: resumeKeys.lists() });
    },
  });
}
