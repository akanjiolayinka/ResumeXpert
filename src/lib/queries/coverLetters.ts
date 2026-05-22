import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import { tailoringJobKeys } from "@/lib/queries/tailoringJobs";

export type CoverLetter = Database["public"]["Tables"]["cover_letters"]["Row"];

export const coverLetterKeys = {
  all: ["cover_letters"] as const,
  lists: () => [...coverLetterKeys.all, "list"] as const,
  latest: () => [...coverLetterKeys.all, "latest"] as const,
  detail: (id: string) => [...coverLetterKeys.all, "detail", id] as const,
};

/**
 * Fetches the user's most recent cover letter. Used by the page to
 * pre-populate the editor on load — if the user already has a letter,
 * we show it instead of forcing them through generation again.
 */
export function useLatestCoverLetter() {
  return useQuery({
    queryKey: coverLetterKeys.latest(),
    queryFn: async (): Promise<CoverLetter | null> => {
      const { data, error } = await supabase
        .from("cover_letters")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export type GenerateCoverLetterInput = {
  tailoring_job_id?: string;
  base_resume_id?: string;
  role_title: string;
  company_name: string;
  job_description: string;
  tone: "warm" | "direct" | "enthusiastic";
  proof_points?: string[];
};

export type GenerateCoverLetterResult = {
  cover_letter: CoverLetter;
};

export function useGenerateCoverLetter() {
  const qc = useQueryClient();
  return useMutation<GenerateCoverLetterResult, Error, GenerateCoverLetterInput>({
    mutationFn: async (input) => {
      const { data, error } = await supabase.functions.invoke(
        "generate-cover-letter",
        { body: input },
      );
      if (error) throw new Error(error.message ?? "Failed to generate cover letter");
      const payload = data as { cover_letter?: CoverLetter; error?: string };
      if (!payload.cover_letter) {
        throw new Error(payload.error ?? "Generation returned no result");
      }
      return { cover_letter: payload.cover_letter };
    },
    onSuccess: (result, vars) => {
      qc.invalidateQueries({ queryKey: coverLetterKeys.all });
      qc.setQueryData(coverLetterKeys.latest(), result.cover_letter);
      if (vars.tailoring_job_id) {
        qc.invalidateQueries({ queryKey: tailoringJobKeys.all });
      }
    },
  });
}

export type UpdateCoverLetterInput = {
  id: string;
  body: string;
};

export function useUpdateCoverLetter() {
  const qc = useQueryClient();
  return useMutation<CoverLetter, Error, UpdateCoverLetterInput>({
    mutationFn: async ({ id, body }) => {
      const { data, error } = await supabase
        .from("cover_letters")
        .update({ body } as never)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as CoverLetter;
    },
    onSuccess: (updated) => {
      qc.setQueryData(coverLetterKeys.detail(updated.id), updated);
      qc.setQueryData(coverLetterKeys.latest(), updated);
      qc.invalidateQueries({ queryKey: coverLetterKeys.lists() });
    },
  });
}
