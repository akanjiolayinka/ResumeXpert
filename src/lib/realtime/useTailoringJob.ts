import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import { useScoreResume } from "@/lib/queries/atsScores";

export type TailoringJob = Database["public"]["Tables"]["tailoring_jobs"]["Row"];

type State = {
  job: TailoringJob | null;
  isLoading: boolean;
  error: string | null;
};

/**
 * Subscribes to a single tailoring_jobs row via Supabase Realtime so the UI
 * sees status transitions (pending -> running -> succeeded | failed) without
 * polling. Returns null job + isLoading=false when id is null/undefined, so
 * callers can guard rendering without conditional hooks.
 *
 * Side effect (Fi4): when the job first transitions to status='succeeded'
 * with ats_score_id=null, automatically fires the score-ats edge function
 * so the user sees an ATS score without a separate manual step. Tracked per
 * job id via a ref to avoid double-firing on re-renders.
 */
export function useTailoringJob(id: string | null | undefined): State {
  const [state, setState] = useState<State>({
    job: null,
    isLoading: !!id,
    error: null,
  });

  const scoreResume = useScoreResume();
  const autoScoredFor = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!id) {
      setState({ job: null, isLoading: false, error: null });
      return;
    }

    let cancelled = false;
    setState({ job: null, isLoading: true, error: null });

    // Initial fetch — Realtime only pushes UPDATEs, so we need the current
    // row to seed the state.
    void (async () => {
      const { data, error } = await supabase
        .from("tailoring_jobs")
        .select("*")
        .eq("id", id)
        .single();
      if (cancelled) return;
      if (error) {
        setState({ job: null, isLoading: false, error: error.message });
        return;
      }
      setState({ job: data, isLoading: false, error: null });
    })();

    const channel = supabase
      .channel(`tailoring_job:${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tailoring_jobs",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          if (cancelled) return;
          const next = payload.new as TailoringJob;
          setState((prev) => ({ ...prev, job: next, isLoading: false }));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [id]);

  // Auto-trigger ATS scoring when job succeeds without a linked score yet.
  useEffect(() => {
    const job = state.job;
    if (!job) return;
    if (job.status !== "succeeded") return;
    if (job.ats_score_id) return;
    if (autoScoredFor.current.has(job.id)) return;
    autoScoredFor.current.add(job.id);
    scoreResume.mutate({ tailoring_job_id: job.id });
  }, [state.job, scoreResume]);

  return state;
}
