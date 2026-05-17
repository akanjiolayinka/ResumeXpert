// score-ats (Fi4)
//
// Pipeline:
//   1. Validate input (ScoreInputSchema — union of tailoring_job_id or
//      { resume_id, job_description? }).
//   2. Resolve the resume text and JD text from the input:
//        - tailoring_job_id  -> load tailoring_jobs + linked tailored_resumes;
//                               use tailored.rendered_text + job.job_description.
//        - resume_id         -> load resumes; use raw_text + supplied JD.
//      All loads go through the user-JWT client so RLS enforces ownership.
//   3. Compute precomputed keyword overlap from _shared/keywords.ts. Feed it
//      into the prompt as ground truth so the LLM doesn't recount.
//   4. Call Llama (LLAMA_70B, score.v1, json mode, fallback on). Validate
//      against ATSScoreOutputSchema. One corrective retry on Zod failure.
//   5. Insert ats_scores row with subscores + suggestions as jsonb, plus
//      matched_keywords + missing_keywords as text[]. scored_resume_id is set
//      when scoring a tailored_resume; base_resume_id is set in both flows.
//   6. If tailoring_job_id was supplied, update tailoring_jobs.ats_score_id.
//   7. Return { ats_score }.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { getUserFromRequest, jsonResponse } from "../_shared/client.ts";
import { chatCompletion, LLAMA_70B } from "../_shared/llama.ts";
import { SCORE_SYSTEM_PROMPT, SCORE_PROMPT_VERSION } from "../_shared/prompts.ts";
import { computeKeywordOverlap, type KeywordOverlap } from "../_shared/keywords.ts";
import {
  ScoreInputSchema,
  ATSScoreOutputSchema,
  type ATSScoreOutput,
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

  const parsed = ScoreInputSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonResponse(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // ── Resolve the resume + JD pair ────────────────────────────────────
  let resumeText: string;
  let jdText: string;
  let tailoringJobId: string | null = null;
  let baseResumeId: string | null = null;
  let scoredResumeId: string | null = null;

  if ("tailoring_job_id" in parsed.data) {
    tailoringJobId = parsed.data.tailoring_job_id;

    const { data: job, error: jobErr } = await authed.client
      .from("tailoring_jobs")
      .select("*")
      .eq("id", tailoringJobId)
      .single();
    if (jobErr || !job) {
      return jsonResponse({ error: "job_not_found" }, { status: 404 });
    }
    if (!job.tailored_resume_id) {
      return jsonResponse(
        { error: "job_not_succeeded", detail: "Tailored resume is not ready yet." },
        { status: 409 },
      );
    }

    const { data: tailored, error: tErr } = await authed.client
      .from("tailored_resumes")
      .select("*")
      .eq("id", job.tailored_resume_id)
      .single();
    if (tErr || !tailored) {
      return jsonResponse({ error: "tailored_resume_not_found" }, { status: 404 });
    }

    resumeText = tailored.rendered_text;
    jdText = job.job_description;
    baseResumeId = job.base_resume_id;
    scoredResumeId = tailored.id;
  } else {
    const { resume_id, job_description } = parsed.data;
    const { data: resume, error: rErr } = await authed.client
      .from("resumes")
      .select("*")
      .eq("id", resume_id)
      .single();
    if (rErr || !resume) {
      return jsonResponse({ error: "resume_not_found" }, { status: 404 });
    }
    resumeText = resume.raw_text;
    jdText = job_description ?? "";
    baseResumeId = resume.id;
  }

  // ── Precomputed keyword overlap (ground truth fed to the LLM) ───────
  const overlap = computeKeywordOverlap(resumeText, jdText);

  // ── Score via Llama with one corrective retry ───────────────────────
  const scoreResult = await coerceScore(resumeText, jdText, overlap);
  if (!scoreResult.ok) {
    return jsonResponse(
      { error: "scoring_failed", detail: scoreResult.errorSummary },
      { status: 500 },
    );
  }
  const { output, providerModel } = scoreResult;

  // ── Insert ats_scores row ───────────────────────────────────────────
  const { data: atsRow, error: insertError } = await authed.client
    .from("ats_scores")
    .insert({
      user_id: authed.user.id,
      tailoring_job_id: tailoringJobId,
      base_resume_id: baseResumeId,
      scored_resume_id: scoredResumeId,
      overall: output.overall,
      subscores: output.subscores as never,
      suggestions: output.suggestions as never,
      matched_keywords: overlap.matched,
      missing_keywords: overlap.missing,
      model: providerModel,
      prompt_version: SCORE_PROMPT_VERSION,
    } as never)
    .select("*")
    .single();

  if (insertError || !atsRow) {
    return jsonResponse(
      { error: "ats_insert_failed", detail: insertError?.message },
      { status: 500 },
    );
  }

  // ── If tied to a job, link the score back ───────────────────────────
  if (tailoringJobId) {
    const { error: linkErr } = await authed.client
      .from("tailoring_jobs")
      .update({ ats_score_id: atsRow.id } as never)
      .eq("id", tailoringJobId);
    if (linkErr) {
      // The score row is persisted; surface the link failure but don't fail
      // the whole request. The UI can still display the score via direct
      // ats_score id.
      return jsonResponse({
        ats_score: atsRow,
        warning: "link_to_job_failed",
        detail: linkErr.message,
      });
    }
  }

  return jsonResponse({ ats_score: atsRow });
});

// ── Helpers ────────────────────────────────────────────────────────────

type CoerceResult =
  | { ok: true; output: ATSScoreOutput; providerModel: string }
  | { ok: false; errorSummary: string };

async function coerceScore(
  resumeText: string,
  jdText: string,
  overlap: KeywordOverlap,
): Promise<CoerceResult> {
  const userMessage = [
    `Resume plaintext:\n${resumeText}`,
    jdText
      ? `Job description:\n${jdText}`
      : "Job description: (none supplied — assess structure, formatting, and impact only; set keyword subscore to a 60 baseline and mention the missing JD in reasoning.)",
    `Precomputed keyword overlap (DO NOT recount — trust this):\n${JSON.stringify(
      {
        matched: overlap.matched,
        missing: overlap.missing,
        overlapScore: overlap.overlapScore,
      },
      null,
      2,
    )}`,
  ].join("\n\n");

  const baseMessages = [
    { role: "system" as const, content: SCORE_SYSTEM_PROMPT },
    { role: "user" as const, content: userMessage },
  ];

  const first = await tryParse(baseMessages);
  if (first.ok) return first;

  const corrective = [
    ...baseMessages,
    {
      role: "system" as const,
      content:
        "Your previous response did not match the ATSScoreOutput schema. " +
        "Validation errors: " +
        first.errorSummary +
        ". Return JSON only matching: { overall: int 0-100, subscores: { keyword, structure, formatting, impact — all int 0-100 }, suggestions: array of 3 to 5 { priority: 'high'|'medium'|'low', text, anchor? }, reasoning?: string }.",
    },
  ];
  return await tryParse(corrective);
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
      temperature: 0.2,
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

  const validation = ATSScoreOutputSchema.safeParse(parsed);
  if (!validation.success) {
    const issues = validation.error.issues
      .slice(0, 6)
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    return { ok: false, errorSummary: issues };
  }
  return { ok: true, output: validation.data, providerModel };
}
