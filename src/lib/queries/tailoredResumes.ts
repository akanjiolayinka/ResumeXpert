import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

export type TailoredResume = Database["public"]["Tables"]["tailored_resumes"]["Row"];

export const tailoredResumeKeys = {
  all: ["tailored_resumes"] as const,
  byIds: (ids: string[]) => [...tailoredResumeKeys.all, "byIds", ids.slice().sort().join(",")] as const,
};

/**
 * Bulk-fetch tailored resumes by id. Used by the Dashboard history table so
 * each row's Export PDF button can render without firing N individual
 * queries. RLS scopes results to the calling user.
 */
export function useTailoredResumes(ids: string[]) {
  return useQuery({
    queryKey: tailoredResumeKeys.byIds(ids),
    queryFn: async (): Promise<TailoredResume[]> => {
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("tailored_resumes")
        .select("*")
        .in("id", ids);
      if (error) throw error;
      return data ?? [];
    },
    enabled: ids.length > 0,
  });
}
