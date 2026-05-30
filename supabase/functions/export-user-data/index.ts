// export-user-data (Fi9)
//
// Collects every row owned by the calling user across the per-user tables
// and returns it as a single JSON download. RLS still applies — we use the
// user-JWT client so each select returns only the caller's rows.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getUserFromRequest } from "../_shared/client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authed = await getUserFromRequest(req);
  if (!authed) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const tables = [
    "profiles",
    "resumes",
    "tailoring_jobs",
    "tailored_resumes",
    "ats_scores",
    "cover_letters",
    "chat_sessions",
    "chat_messages",
  ] as const;

  const data: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    user_id: authed.user.id,
    email: authed.user.email,
  };

  for (const t of tables) {
    // deno-lint-ignore no-explicit-any
    const { data: rows, error } = await (authed.client as any).from(t).select("*");
    if (error) {
      // Record the error per table rather than failing the whole export —
      // partial exports beat no export when one table hits a quirk.
      data[t] = { error: error.message };
    } else {
      data[t] = rows ?? [];
    }
  }

  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="resumexpert-data.json"',
    },
  });
});
