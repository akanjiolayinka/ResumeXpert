// TODO: implement in Fi6 (Chat).
//
// Will: validate ChatInputSchema, find-or-create the chat_sessions row
// (single-session-per-user model for v1), persist the user message, build
// the system context (resume.structured + JD if a tailoring_job_id is
// supplied), call chatCompletion on LLAMA_8B with streaming enabled,
// pipe SSE `{ delta: string }` events back to the client, persist the final
// assistant message, emit `{ done: true, session_id, assistant_message_id }`.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getUserFromRequest, jsonResponse } from "../_shared/client.ts";

Deno.serve(async (req: Request) => {
  const authed = await getUserFromRequest(req);
  if (!authed) {
    return jsonResponse({ error: "unauthorized" }, { status: 401 });
  }

  return jsonResponse({ error: "not implemented" }, { status: 501 });
});
