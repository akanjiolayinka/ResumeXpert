import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

export type TailoringJob = Database["public"]["Tables"]["tailoring_jobs"]["Row"];
export type TailoredResume = Database["public"]["Tables"]["tailored_resumes"]["Row"];

// ── Query keys ──────────────────────────────────────────────────────────────
export const tailoringJobKeys = {
  all: ["tailoring_jobs"] as const,
  lists: () => [...tailoringJobKeys.all, "list"] as const,
  detail: (id: string) => [...tailoringJobKeys.all, "detail", id] as const,
};

export const tailoredResumeKeys = {
  all: ["tailored_resumes"] as const,
  detail: (id: string) => [...tailoredResumeKeys.all, "detail", id] as const,
};

// ── Hooks ───────────────────────────────────────────────────────────────────

export function useTailoringJobs() {
  return useQuery({
    queryKey: tailoringJobKeys.lists(),
    queryFn: async (): Promise<TailoringJob[]> => {
      const { data, error } = await supabase
        .from("tailoring_jobs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTailoredResume(id: string | null | undefined) {
  return useQuery({
    queryKey: id ? tailoredResumeKeys.detail(id) : ["tailored_resumes", "noop"],
    queryFn: async (): Promise<TailoredResume | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("tailored_resumes")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export type CreateTailoringJobInput = {
  /** When null, the mutation auto-creates a manual resumes row from resumeText. */
  baseResumeId: string | null;
  resumeText: string;
  jobDescription: string;
  roleTitle?: string;
  companyName?: string;
};

export type CreateTailoringJobResult = {
  jobId: string;
};

/**
 * Inserts a tailoring_jobs row (status='pending') and fires the tailor-resume
 * edge function in the background. Resolves as soon as the row is inserted
 * and the function is invoked — the caller subscribes to status transitions
 * via useTailoringJob(jobId).
 *
 * If baseResumeId is null, auto-creates a manual resumes row first using the
 * minimal structured shape (rawTextOnly: true) — same pattern as the upload
 * soft-fail path, so downstream code only needs to handle one "structured is
 * not canonical" case.
 */
export function useCreateTailoringJob() {
  const qc = useQueryClient();
  return useMutation<CreateTailoringJobResult, Error, CreateTailoringJobInput>({
    mutationFn: async (input) => {
      const { data: u, error: userError } = await supabase.auth.getUser();
      if (userError || !u.user) throw new Error("Not authenticated");
      const userId = u.user.id;

      let baseResumeId = input.baseResumeId;
      if (!baseResumeId) {
        const firstLine =
          input.resumeText
            .split(/\r?\n/)
            .map((l) => l.trim())
            .find((l) => l.length > 0) ?? "";
        const { data: created, error: rErr } = await supabase
          .from("resumes")
          .insert({
            user_id: userId,
            label: "Pasted resume",
            source_kind: "manual",
            raw_text: input.resumeText,
            structured: {
              rawTextOnly: true,
              fullName: firstLine.slice(0, 120),
            } as never,
            // parse_failed is set at the DB level via migration 0002. Until
            // database.types.ts is regenerated to include it, we omit it
            // here and rely on the column default (false). The structured
            // shape's rawTextOnly flag is the actual signal used by tailor-
            // resume and the UI.
          } as never)
          .select("id")
          .single();
        if (rErr || !created) {
          throw new Error(rErr?.message ?? "Failed to create manual resume row");
        }
        baseResumeId = created.id;
      }

      const { data: job, error: jErr } = await supabase
        .from("tailoring_jobs")
        .insert({
          user_id: userId,
          base_resume_id: baseResumeId,
          job_description: input.jobDescription,
          role_title: input.roleTitle ?? null,
          company_name: input.companyName ?? null,
          status: "pending",
        } as never)
        .select("id")
        .single();
      if (jErr || !job) {
        throw new Error(jErr?.message ?? "Failed to create tailoring job");
      }

      // Fire the edge function and wait for it. The function's success path
      // ends with an UPDATE that the Realtime subscription delivers, so the
      // UI can show pending -> running -> succeeded without polling. Errors
      // here are surfaced through the job row's error_message (the function
      // writes status='failed' on failure) — but we also reject the
      // mutation so the page can show a fallback toast for network-level
      // failures that never reach the function.
      const { error: fErr } = await supabase.functions.invoke("tailor-resume", {
        body: { tailoring_job_id: job.id },
      });
      if (fErr) {
        // The function may have already set status='failed' before failing
        // to respond cleanly; if it never started we leave the row in
        // 'pending' and write a client-side failure marker so the UI
        // doesn't hang.
        await supabase
          .from("tailoring_jobs")
          .update({
            status: "failed",
            error_message: fErr.message?.slice(0, 500) ?? "Network error",
            completed_at: new Date().toISOString(),
          } as never)
          .eq("id", job.id)
          .in("status", ["pending", "running"]);
        throw new Error(fErr.message ?? "Tailoring request failed");
      }

      qc.invalidateQueries({ queryKey: tailoringJobKeys.lists() });
      return { jobId: job.id };
    },
  });
}
