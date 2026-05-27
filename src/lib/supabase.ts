import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing Supabase env vars. Copy .env.example to .env.local and fill in " +
      "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

export const supabase = createClient<Database>(url, anonKey);

// Exposed for callers that bypass supabase-js (e.g. the chat SSE stream uses
// a raw fetch with response.body.getReader(), which functions.invoke can't do).
export const SUPABASE_URL = url;
export const SUPABASE_ANON_KEY = anonKey;
