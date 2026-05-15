import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

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
 */
export function useTailoringJob(id: string | null | undefined): State {
  const [state, setState] = useState<State>({
    job: null,
    isLoading: !!id,
    error: null,
  });

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

  return state;
}
