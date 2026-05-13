// TODO: implement in Fi3 (Tailoring pipeline).
//
// Will: validate TailorInputSchema, load the tailoring_jobs row, idempotency-
// check status (refuse if 'running' or 'succeeded'), set status='running',
// load the base resume's structured + raw_text, call chatCompletion with the
// tailor.v1 prompt on LLAMA_70B, validate against TailoredResumeStructuredSchema,
// insert into tailored_resumes, update tailoring_jobs.status='succeeded' and
// link tailored_resume_id, return TailorOutput. On any failure set
// status='failed' with error_message and return a typed error.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getUserFromRequest, jsonResponse } from "../_shared/client.ts";

Deno.serve(async (req: Request) => {
  const authed = await getUserFromRequest(req);
  if (!authed) {
    return jsonResponse({ error: "unauthorized" }, { status: 401 });
  }

  return jsonResponse({ error: "not implemented" }, { status: 501 });
});
