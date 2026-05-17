import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import { tailoringJobKeys } from "@/lib/queries/tailoringJobs";

export type ATSScore = Database["public"]["Tables"]["ats_scores"]["Row"];

export type ATSSubscores = {
  keyword: number;
  structure: number;
  formatting: number;
  impact: number;
};

export type ATSSuggestion = {
  priority: "high" | "medium" | "low";
  text: string;
  anchor?: string;
};

// ── Query keys ──────────────────────────────────────────────────────────────
export const atsScoreKeys = {
  all: ["ats_scores"] as const,
  detail: (id: string) => [...atsScoreKeys.all, "detail", id] as const,
};

// ── Mutation ────────────────────────────────────────────────────────────────

export type ScoreResumeInput =
  | { tailoring_job_id: string }
  | { resume_id: string; job_description?: string };

export type ScoreResumeResult = {
  ats_score: ATSScore;
};

/**
 * Invokes the score-ats edge function. Two shapes:
 *   - { tailoring_job_id }            — scores the tailored resume + links it
 *   - { resume_id, job_description? } — standalone scan of a base resume
 *
 * On success invalidates the tailoring jobs list so the linked ats_score_id
 * shows up in any list view.
 */
export function useScoreResume() {
  const qc = useQueryClient();
  return useMutation<ScoreResumeResult, Error, ScoreResumeInput>({
    mutationFn: async (input) => {
      const { data, error } = await supabase.functions.invoke("score-ats", {
        body: input,
      });
      if (error) {
        throw new Error(error.message ?? "Failed to score resume");
      }
      // Edge function returns { ats_score } or an error payload; data.error
      // would only land here if the function returned 2xx with an error
      // field (shouldn't happen) — guard anyway.
      const payload = data as { ats_score?: ATSScore; error?: string };
      if (!payload.ats_score) {
        throw new Error(payload.error ?? "Scoring returned no result");
      }
      return { ats_score: payload.ats_score };
    },
    onSuccess: (_result, vars) => {
      if ("tailoring_job_id" in vars) {
        qc.invalidateQueries({ queryKey: tailoringJobKeys.all });
      }
    },
  });
}
