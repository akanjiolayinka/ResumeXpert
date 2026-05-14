import { QueryClient } from "@tanstack/react-query";

// Sensible defaults for ResumeTailor:
// - 5 min staleTime: most reads (profile, resumes, history) don't change
//   between tabs and we want fewer roundtrips.
// - retry 1: Supabase reads occasionally hiccup; one retry covers transient
//   failures without prolonging error states for the user.
// - refetchOnWindowFocus disabled: AI results are expensive; we never want a
//   tab-focus to silently kick off a new generation.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
