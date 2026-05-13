// Service-role Supabase client. BYPASSES Row Level Security.
//
// USE ONLY for:
//   (1) parse-upload storage reads after ownership verification (the path
//       prefix has been confirmed to match the authenticated user's id).
//   (2) support-message and waitlist-signup inserts that may be anonymous
//       (no auth.uid() available, so the user-JWT client cannot satisfy the
//       RLS policy alone — though the policy itself permits NULL user_id,
//       service-role bypasses entirely for simplicity and uniformity).
//   (3) Anywhere a function legitimately needs to bypass RLS for cross-user
//       or system-level work (e.g. reading from auth.users for the
//       handle_new_user trigger context).
//
// All OTHER edge functions must use the user-JWT client from `client.ts`, so
// every read/write is authorized by RLS against the requesting user.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in edge function environment.",
  );
}

export const supabaseAdmin: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);
