// TODO: implement in Fi4 (ATS scoring).
//
// Will: validate ScoreInputSchema (either tailoring_job_id or
// { resume_id, job_description? }), idempotency-check when scoring via job,
// compute keyword overlap via _shared/keywords.computeKeywordOverlap, call
// chatCompletion with the score.v1 prompt on LLAMA_70B (response_format
// json_object), validate against ATSScoreOutputSchema, insert into
// ats_scores, return ScoreOutput. If tied to a job, also update
// tailoring_jobs.ats_score_id.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getUserFromRequest, jsonResponse } from "../_shared/client.ts";

Deno.serve(async (req: Request) => {
  const authed = await getUserFromRequest(req);
  if (!authed) {
    return jsonResponse({ error: "unauthorized" }, { status: 401 });
  }

  return jsonResponse({ error: "not implemented" }, { status: 501 });
});
