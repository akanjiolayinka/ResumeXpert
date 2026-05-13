// User-JWT Supabase client factory + request helper.
//
// This is the DEFAULT client for edge functions. It wraps the user's JWT into
// the Authorization header so RLS policies see auth.uid() correctly. Every
// read/write through it is gated by the same RLS that the browser sees.
//
// Use `getUserFromRequest(req)` at the top of every protected edge function:
// it extracts the Bearer token, verifies it via supabase.auth.getUser, and
// returns the resolved User plus a ready-to-use client. Functions that fall
// through to the service-role client (see admin.ts) MUST still verify
// ownership before reading user-scoped resources.

import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_ANON_KEY in edge function environment.",
  );
}

export function createUserClient(jwt: string): SupabaseClient {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type AuthedRequest = {
  user: User;
  client: SupabaseClient;
  jwt: string;
};

/**
 * Extracts the Bearer token from the request, verifies it, and returns the
 * resolved User and a JWT-scoped Supabase client. Returns null when the
 * Authorization header is missing or invalid — callers should respond 401.
 */
export async function getUserFromRequest(req: Request): Promise<AuthedRequest | null> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(authHeader);
  if (!match) return null;
  const jwt = match[1];

  const client = createUserClient(jwt);
  const { data, error } = await client.auth.getUser(jwt);
  if (error || !data.user) return null;

  return { user: data.user, client, jwt };
}

/** Standard JSON response builder. */
export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}
