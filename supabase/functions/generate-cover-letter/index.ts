// TODO: implement in Fi5 (Cover letter).
//
// Will: validate CoverInputSchema, optionally load the linked tailoring_job
// or base resume for proof-point context, call chatCompletion with the
// cover.v1 prompt on LLAMA_70B (response_format json_object), validate
// against CoverLetterBodySchema, insert into cover_letters, return
// CoverOutput. If tied to a tailoring_job, also update
// tailoring_jobs.cover_letter_id.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getUserFromRequest, jsonResponse } from "../_shared/client.ts";

Deno.serve(async (req: Request) => {
  const authed = await getUserFromRequest(req);
  if (!authed) {
    return jsonResponse({ error: "unauthorized" }, { status: 401 });
  }

  return jsonResponse({ error: "not implemented" }, { status: 501 });
});
