// support-message (Fi9)
//
// Accepts a support or feature_request submission. Both authenticated (from
// Settings → Help) and anonymous (from /contact) callers go through the same
// endpoint; user_id is set from the JWT when present, otherwise NULL. The
// table's RLS policy permits inserts with user_id=auth.uid() OR user_id IS
// NULL, but we route through the service-role client to keep the function
// uniform with parse-upload + waitlist-signup.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "npm:zod@3";
import { jsonResponse } from "../_shared/client.ts";
import { supabaseAdmin } from "../_shared/admin.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const InputSchema = z.object({
  kind: z.enum(["support", "feature_request"]),
  message: z.string().trim().min(10).max(5000),
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().email().max(254).optional(),
});

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

async function resolveUserId(req: Request): Promise<string | null> {
  const m = /^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization") ?? "");
  if (!m) return null;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  // Bare client just to call getUser — we don't reuse for writes.
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data } = await client.auth.getUser(m[1]);
  return data.user?.id ?? null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, { status: 405, headers: corsHeaders });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, { status: 400, headers: corsHeaders });
  }

  const parsed = InputSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonResponse(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400, headers: corsHeaders },
    );
  }

  const userId = await resolveUserId(req);

  const { error } = await supabaseAdmin.from("support_messages").insert({
    user_id: userId,
    kind: parsed.data.kind,
    message: parsed.data.message,
    name: parsed.data.name ?? null,
    email: parsed.data.email ?? null,
  } as never);

  if (error) {
    return jsonResponse(
      { error: "insert_failed", detail: error.message },
      { status: 500, headers: corsHeaders },
    );
  }

  return jsonResponse({ ok: true }, { status: 201, headers: corsHeaders });
});
