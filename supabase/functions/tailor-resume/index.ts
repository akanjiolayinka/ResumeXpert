// tailor-resume (Fi3)
//
// Pipeline:
//   1. Validate input (TailorInputSchema -> tailoring_job_id).
//   2. Load the tailoring_job row via user-JWT client so RLS verifies
//      ownership. 404 if not visible to the user.
//   3. Idempotency (tightening note #2):
//        status='running'    -> 409
//        status='succeeded'  -> return the existing tailored_resume
//        status='pending' or 'failed' -> proceed (clear error_message)
//   4. Load the linked base_resume.
//   5. Set status='running' as the first DB write.
//   6. Build the user message: structured JSON when available, otherwise
//      raw_text (covers the rawTextOnly soft-fail case and the manual
//      paste case where ResumeTailor auto-creates a manual resume row).
//   7. Call Llama (LLAMA_70B, tailor.v1, json mode, fallback on).
//   8. Validate against TailoredResumeStructuredSchema. On Zod failure,
//      retry once with corrective system message. On second failure,
//      mark job 'failed' with error_message and return 500.
//   9. Flatten the structured output to rendered_text for ATS scoring +
//      export. Insert tailored_resumes row via user-JWT client.
//  10. Update tailoring_jobs: status='succeeded', tailored_resume_id,
//      completed_at=now(). Return { tailored_resume, tailoring_job }.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { getUserFromRequest, jsonResponse } from "../_shared/client.ts";
import { chatCompletion, LLAMA_70B } from "../_shared/llama.ts";
import { TAILOR_SYSTEM_PROMPT, TAILOR_PROMPT_VERSION } from "../_shared/prompts.ts";
import {
  TailorInputSchema,
  TailoredResumeStructuredSchema,
  type TailoredResumeStructured,
} from "../_shared/schemas.ts";

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

  const parsed = TailorInputSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonResponse(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { tailoring_job_id } = parsed.data;

  // ── Load job (RLS enforces ownership) ───────────────────────────────
  const { data: job, error: jobError } = await authed.client
    .from("tailoring_jobs")
    .select("*")
    .eq("id", tailoring_job_id)
    .single();
  if (jobError || !job) {
    return jsonResponse({ error: "job_not_found" }, { status: 404 });
  }

  // ── Idempotency ────────────────────────────────────────────────────
  if (job.status === "running") {
    return jsonResponse(
      { error: "already_running", tailoring_job_id },
      { status: 409 },
    );
  }
  if (job.status === "succeeded" && job.tailored_resume_id) {
    const { data: existing } = await authed.client
      .from("tailored_resumes")
      .select("*")
      .eq("id", job.tailored_resume_id)
      .single();
    if (existing) {
      return jsonResponse({ tailored_resume: existing, tailoring_job: job });
    }
    // Fall through: linked row was deleted; re-run the pipeline.
  }

  // ── Load base resume ────────────────────────────────────────────────
  const { data: baseResume, error: baseError } = await authed.client
    .from("resumes")
    .select("*")
    .eq("id", job.base_resume_id)
    .single();
  if (baseError || !baseResume) {
    await markFailed(authed.client, tailoring_job_id, "base_resume_missing");
    return jsonResponse({ error: "base_resume_not_found" }, { status: 404 });
  }

  // ── First DB write: set status='running' ────────────────────────────
  const { error: runErr } = await authed.client
    .from("tailoring_jobs")
    .update({
      status: "running",
      error_message: null,
    } as never)
    .eq("id", tailoring_job_id);
  if (runErr) {
    return jsonResponse(
      { error: "status_update_failed", detail: runErr.message },
      { status: 500 },
    );
  }

  // ── Build user message ──────────────────────────────────────────────
  const structured = baseResume.structured as Record<string, unknown> | null;
  const hasFullStructured =
    structured && !structured.rawTextOnly && !baseResume.parse_failed;

  const resumeBlock = hasFullStructured
    ? `Resume (structured JSON):\n${JSON.stringify(structured, null, 2)}`
    : `Resume (plaintext — no structured parse available):\n${baseResume.raw_text}`;

  const jdBlock = `Job description:\n${job.job_description}`;
  const userMessage = `${resumeBlock}\n\n${jdBlock}`;

  // ── Call Llama with one corrective retry on Zod failure ─────────────
  const tailoredResult = await coerceTailored(userMessage);
  if (!tailoredResult.ok) {
    await markFailed(authed.client, tailoring_job_id, tailoredResult.errorSummary);
    return jsonResponse(
      { error: "tailoring_failed", detail: tailoredResult.errorSummary },
      { status: 500 },
    );
  }
  const { structured: tailoredStructured, providerModel } = tailoredResult;

  const renderedText = flattenStructured(tailoredStructured);

  // ── Insert tailored_resumes ────────────────────────────────────────
  const { data: tailoredRow, error: insertError } = await authed.client
    .from("tailored_resumes")
    .insert({
      user_id: authed.user.id,
      base_resume_id: baseResume.id,
      tailoring_job_id,
      structured: tailoredStructured as never,
      rendered_text: renderedText,
      model: providerModel,
      prompt_version: TAILOR_PROMPT_VERSION,
    } as never)
    .select("*")
    .single();

  if (insertError || !tailoredRow) {
    await markFailed(authed.client, tailoring_job_id, insertError?.message ?? "insert_failed");
    return jsonResponse(
      { error: "tailored_insert_failed", detail: insertError?.message },
      { status: 500 },
    );
  }

  // ── Mark job succeeded ──────────────────────────────────────────────
  const { data: updatedJob, error: updateError } = await authed.client
    .from("tailoring_jobs")
    .update({
      status: "succeeded",
      tailored_resume_id: tailoredRow.id,
      completed_at: new Date().toISOString(),
      error_message: null,
    } as never)
    .eq("id", tailoring_job_id)
    .select("*")
    .single();

  if (updateError || !updatedJob) {
    return jsonResponse(
      { error: "job_finalize_failed", detail: updateError?.message },
      { status: 500 },
    );
  }

  return jsonResponse({
    tailored_resume: tailoredRow,
    tailoring_job: updatedJob,
    prompt_version: TAILOR_PROMPT_VERSION,
  });
});

// ── Helpers ────────────────────────────────────────────────────────────

type CoerceResult =
  | {
      ok: true;
      structured: TailoredResumeStructured;
      providerModel: string;
    }
  | { ok: false; errorSummary: string };

async function coerceTailored(userMessage: string): Promise<CoerceResult> {
  const baseMessages = [
    { role: "system" as const, content: TAILOR_SYSTEM_PROMPT },
    { role: "user" as const, content: userMessage },
  ];

  const first = await tryParse(baseMessages);
  if (first.ok) return first;

  const correctiveMessages = [
    ...baseMessages,
    {
      role: "system" as const,
      content:
        "Your previous response did not match the TailoredResumeStructured schema. " +
        "Validation errors: " +
        first.errorSummary +
        ". Return JSON only, matching the schema exactly. Required arrays (skills, experiences, projects, education, certifications, awards, volunteering, diffs, gaps) must be present (use [] when empty).",
    },
  ];
  return await tryParse(correctiveMessages);
}

async function tryParse(
  messages: Array<{ role: "system" | "user"; content: string }>,
): Promise<CoerceResult> {
  let content: string;
  let providerModel: string;
  try {
    const result = await chatCompletion({
      model: LLAMA_70B,
      messages,
      json: true,
      temperature: 0.1,
      fallback: true,
    });
    content = result.content;
    providerModel = `${result.provider}:${result.model}`;
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

  const validation = TailoredResumeStructuredSchema.safeParse(parsed);
  if (!validation.success) {
    const issues = validation.error.issues
      .slice(0, 6)
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    return { ok: false, errorSummary: issues };
  }

  return { ok: true, structured: validation.data, providerModel };
}

async function markFailed(
  // deno-lint-ignore no-explicit-any
  client: any,
  jobId: string,
  message: string,
) {
  await client
    .from("tailoring_jobs")
    .update({
      status: "failed",
      error_message: message.slice(0, 500),
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

function flattenStructured(s: TailoredResumeStructured): string {
  const lines: string[] = [];
  lines.push(s.fullName.toUpperCase());

  const contact = [s.location, s.phone, s.email].filter(Boolean).join(" | ");
  if (contact) lines.push(contact);
  const links = [s.links?.linkedin, s.links?.portfolio].filter(Boolean).join(" | ");
  if (links) lines.push(links);
  lines.push("");

  if (s.summary) {
    lines.push("PROFESSIONAL SUMMARY");
    lines.push("-".repeat(40));
    lines.push(s.summary);
    lines.push("");
  }

  if (s.skills.length) {
    lines.push("SKILLS");
    lines.push("-".repeat(40));
    lines.push(s.skills.join(", "));
    lines.push("");
  }

  if (s.experiences.length) {
    lines.push("EXPERIENCE");
    lines.push("-".repeat(40));
    for (const exp of s.experiences) {
      lines.push(`${exp.role} — ${exp.company} | ${exp.dates}`);
      for (const b of exp.bullets) lines.push(`• ${b}`);
      if (exp.metrics) {
        for (const m of exp.metrics) lines.push(`• Impact: ${m}`);
      }
      lines.push("");
    }
  }

  if (s.projects.length) {
    lines.push("PROJECTS");
    lines.push("-".repeat(40));
    for (const p of s.projects) {
      const header = [p.name, p.stack, p.link].filter(Boolean).join(" | ");
      lines.push(header);
      for (const b of p.bullets) lines.push(`• ${b}`);
      lines.push("");
    }
  }

  if (s.education.length) {
    lines.push("EDUCATION");
    lines.push("-".repeat(40));
    for (const e of s.education) {
      lines.push(
        `${e.school} — ${e.degree} | ${e.dates}${e.gpa ? ` | GPA: ${e.gpa}` : ""}`,
      );
    }
    lines.push("");
  }

  if (s.certifications.length) {
    lines.push("CERTIFICATIONS");
    lines.push("-".repeat(40));
    for (const c of s.certifications) lines.push(`• ${c}`);
    lines.push("");
  }

  if (s.awards.length) {
    lines.push("AWARDS");
    lines.push("-".repeat(40));
    for (const a of s.awards) lines.push(`• ${a}`);
    lines.push("");
  }

  if (s.volunteering.length) {
    lines.push("LEADERSHIP & VOLUNTEERING");
    lines.push("-".repeat(40));
    for (const v of s.volunteering) lines.push(`• ${v}`);
  }

  return lines.join("\n").trim();
}
