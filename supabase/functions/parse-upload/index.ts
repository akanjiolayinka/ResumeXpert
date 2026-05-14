// parse-upload (Fi2)
//
// Owns the upload+parse pipeline:
//   1. Validate input (ParseUploadInputSchema).
//   2. Verify the storage path's first segment matches auth.uid(). Required
//      because step 3 reads via the service-role client and bypasses RLS.
//   3. Download the file from the resume-uploads bucket via the admin client.
//   4. Extract plaintext: unpdf for PDF, mammoth for DOCX.
//   5. Call Llama (LLAMA_70B, parse.v1, json mode) to coerce into
//      ResumeStructured. Validate via ResumeStructuredSchema. On validation
//      failure, retry once with a corrective system message. On second
//      failure, soft-fail: insert with parse_failed=true and a minimal
//      structured shape rather than rejecting the upload.
//   6. Insert the resumes row via the user-JWT client (RLS applies, so the
//      insert is implicitly scoped to the authenticated user).
//   7. Return { resume }.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { extractText as extractPdfText } from "npm:unpdf@0.12.1";
import mammoth from "npm:mammoth@1.8.0";

import { getUserFromRequest, jsonResponse } from "../_shared/client.ts";
import { supabaseAdmin } from "../_shared/admin.ts";
import { chatCompletion, LLAMA_70B } from "../_shared/llama.ts";
import { PARSE_SYSTEM_PROMPT, PARSE_PROMPT_VERSION } from "../_shared/prompts.ts";
import {
  ParseUploadInputSchema,
  ResumeStructuredSchema,
  type ResumeStructured,
} from "../_shared/schemas.ts";

const BUCKET = "resume-uploads";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, { status: 405 });
  }

  const authed = await getUserFromRequest(req);
  if (!authed) return jsonResponse({ error: "unauthorized" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = ParseUploadInputSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonResponse(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { resume_id, storage_path, mime, label } = parsed.data;

  // Ownership check before any service-role I/O. The path convention is
  // '{user_id}/{resume_id}.{ext}' (tightening note #5), so the first
  // segment must equal the requesting user's id.
  const pathPrefix = storage_path.split("/")[0];
  if (pathPrefix !== authed.user.id) {
    return jsonResponse({ error: "forbidden" }, { status: 403 });
  }

  // Download via admin client. Storage RLS would also permit this for the
  // user's JWT, but the admin client avoids dragging the JWT into the
  // storage download flow.
  const { data: blob, error: dlError } = await supabaseAdmin.storage
    .from(BUCKET)
    .download(storage_path);
  if (dlError || !blob) {
    return jsonResponse(
      { error: "download_failed", detail: dlError?.message },
      { status: 502 },
    );
  }

  let rawText: string;
  try {
    rawText = await extractPlaintext(blob, mime);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown extraction error";
    return jsonResponse(
      { error: "extraction_failed", detail: message },
      { status: 422 },
    );
  }

  if (!rawText.trim()) {
    return jsonResponse(
      { error: "empty_document", detail: "No text could be extracted from the file." },
      { status: 422 },
    );
  }

  // Coerce to ResumeStructured via Llama, with one corrective retry.
  const { structured, parseFailed } = await coerceToStructured(rawText);

  // Insert via the user-JWT client so RLS applies and Postgres enforces
  // user_id = auth.uid(). resume_id is the client-supplied UUID from the
  // storage path so the row id matches the file id.
  const { data: row, error: insertError } = await authed.client
    .from("resumes")
    .insert({
      id: resume_id,
      user_id: authed.user.id,
      label: label ?? "My resume",
      source_kind: "upload",
      source_storage_path: storage_path,
      source_mime: mime,
      raw_text: rawText,
      structured: structured as never,
      parse_failed: parseFailed,
    } as never)
    .select("*")
    .single();

  if (insertError || !row) {
    return jsonResponse(
      { error: "insert_failed", detail: insertError?.message },
      { status: 500 },
    );
  }

  return jsonResponse({ resume: row, prompt_version: PARSE_PROMPT_VERSION });
});

async function extractPlaintext(blob: Blob, mime: string): Promise<string> {
  const buffer = await blob.arrayBuffer();
  if (mime === "application/pdf") {
    const result = await extractPdfText(new Uint8Array(buffer), { mergePages: true });
    return Array.isArray(result.text) ? result.text.join("\n") : String(result.text ?? "");
  }
  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer: new Uint8Array(buffer) });
    return result.value ?? "";
  }
  throw new Error(`Unsupported mime: ${mime}`);
}

async function coerceToStructured(
  rawText: string,
): Promise<{ structured: unknown; parseFailed: boolean }> {
  const baseMessages = [
    { role: "system" as const, content: PARSE_SYSTEM_PROMPT },
    { role: "user" as const, content: rawText },
  ];

  // First attempt
  const first = await tryParse(baseMessages);
  if (first.ok) return { structured: first.data, parseFailed: false };

  // Corrective retry — include the validation error in the system context.
  const correctiveMessages = [
    ...baseMessages,
    {
      role: "system" as const,
      content:
        "Your previous response did not match the ResumeStructured schema. " +
        "Validation errors: " +
        first.errorSummary +
        ". Return JSON only, matching the schema exactly. Use empty arrays for absent sections rather than omitting required arrays.",
    },
  ];

  const second = await tryParse(correctiveMessages);
  if (second.ok) return { structured: second.data, parseFailed: false };

  // Soft fail (tightening note #4): keep the upload, surface the partial
  // shape, let the UI prompt the user to fill the rest in manually.
  const firstNonEmptyLine =
    rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 0) ?? "";

  return {
    structured: {
      rawTextOnly: true,
      fullName: firstNonEmptyLine.slice(0, 120),
    },
    parseFailed: true,
  };
}

type ParseResult =
  | { ok: true; data: ResumeStructured }
  | { ok: false; errorSummary: string };

async function tryParse(messages: Array<{ role: "system" | "user"; content: string }>): Promise<ParseResult> {
  let content: string;
  try {
    const result = await chatCompletion({
      model: LLAMA_70B,
      messages,
      json: true,
      temperature: 0,
      fallback: true,
    });
    content = result.content;
  } catch (err) {
    return {
      ok: false,
      errorSummary: err instanceof Error ? err.message : "provider error",
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { ok: false, errorSummary: "Response was not valid JSON" };
  }

  const validation = ResumeStructuredSchema.safeParse(parsed);
  if (!validation.success) {
    const issues = validation.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    return { ok: false, errorSummary: issues };
  }

  return { ok: true, data: validation.data };
}
