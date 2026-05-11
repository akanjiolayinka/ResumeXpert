import { createClient } from "@supabase/supabase-js";

// The generated database type slot. Populated in a later PR via
// `supabase gen types typescript --linked > src/lib/database.types.ts`
// once the schema migration (F2) lands. Intentionally empty for now so
// the client is wired but no schema-shape assumptions are encoded yet.
export type Database = Record<string, never>;

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing Supabase env vars. Copy .env.example to .env.local and fill in " +
      "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

export const supabase = createClient<Database>(url, anonKey);
