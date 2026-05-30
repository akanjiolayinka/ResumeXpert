// delete-account (Fi9)
//
// Verifies the caller via the user-JWT client, then calls
// supabase.auth.admin.deleteUser with the service-role client to actually
// remove the auth.users row. All public.* rows cascade via ON DELETE CASCADE
// foreign keys defined in 0001_init.sql.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getUserFromRequest, jsonResponse } from "../_shared/client.ts";
import { supabaseAdmin } from "../_shared/admin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, { status: 405, headers: corsHeaders });
  }

  const authed = await getUserFromRequest(req);
  if (!authed) {
    return jsonResponse({ error: "unauthorized" }, { status: 401, headers: corsHeaders });
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(authed.user.id);
  if (error) {
    return jsonResponse(
      { error: "delete_failed", detail: error.message },
      { status: 500, headers: corsHeaders },
    );
  }

  return jsonResponse({ deleted: true }, { headers: corsHeaders });
});
