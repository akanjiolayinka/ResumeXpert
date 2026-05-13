// TODO: implement in Fi2 (Upload + parse pipeline).
//
// Will: validate ParseUploadInputSchema, verify storage_path prefix matches
// authed user's id, download the object via the service-role client
// (admin.ts) since the user's JWT cannot read raw storage in this flow,
// extract plaintext (unpdf for PDF, mammoth for DOCX), call chatCompletion
// with the parse.v1 prompt on LLAMA_70B to coerce into ResumeStructured,
// validate via ResumeStructuredSchema. If Zod fails twice, fall back to
// inserting a row with { rawTextOnly: true, fullName: <first line guess> }
// per tightening note #4. Return ParseUploadOutput.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getUserFromRequest, jsonResponse } from "../_shared/client.ts";

Deno.serve(async (req: Request) => {
  const authed = await getUserFromRequest(req);
  if (!authed) {
    return jsonResponse({ error: "unauthorized" }, { status: 401 });
  }

  return jsonResponse({ error: "not implemented" }, { status: 501 });
});
