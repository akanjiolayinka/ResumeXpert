// generate-cover-letter (Fi5)
//
// Pipeline:
//   1. Validate input (CoverInputSchema). At least one of tailoring_job_id
//      or base_resume_id must be present so the prompt has a resume to
//      ground proof points in (truthfulness rule).
//   2. Load the source resume:
//        - tailoring_job_id  -> load job (RLS) + linked tailored_resume.
//                               Pull the top 2-3 most JD-relevant experience
//                               bullets from `structured` as auto proof
//                               points (concatenated with user-supplied
//                               proof_points, capped at 4).
//        - base_resume_id    -> load resumes (RLS); use `structured` for
//                               context.
//   3. Call Llama (LLAMA_70B, cover.v1, json mode, fallback on). The
//      cover.v1 prompt enforces "no fabricated employers/dates/metrics
//      not present in the resume or proof points."
//   4. Validate against CoverLetterBodySchema ({ body: string }). One
//      corrective retry on Zod failure.
//   5. Insert cover_letters row. If tailoring_job_id supplied, link it
//      back via tailoring_jobs.cover_letter_id.
//   6. Return { cover_letter }.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { getUserFromRequest, jsonResponse } from "../_shared/client.ts";
import { chatCompletion, LLAMA_70B } from "../_shared/llama.ts";
import { COVER_SYSTEM_PROMPT, COVER_PROMPT_VERSION } from "../_shared/prompts.ts";
import {
  CoverInputSchema,
  CoverLetterBodySchema,
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

  const parsed = CoverInputSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonResponse(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const input = parsed.data;

  if (!input.tailoring_job_id && !input.base_resume_id) {
    return jsonResponse(
      {
        error: "missing_source",
        detail: "Either tailoring_job_id or base_resume_id is required.",
      },
      { status: 400 },
    );
  }

  // ── Resolve resume structured context + auto proof points ───────────
  let resumeStructured: Record<string, unknown> | null = null;
  let rawTextFallback: string | null = null;
  let baseResumeId: string | null = null;
  let autoProofPoints: string[] = [];

  if (input.tailoring_job_id) {
    const { data: job, error: jobErr } = await authed.client
      .from("tailoring_jobs")
      .select("*")
      .eq("id", input.tailoring_job_id)
      .single();
    if (jobErr || !job) {
      return jsonResponse({ error: "job_not_found" }, { status: 404 });
    }
    baseResumeId = job.base_resume_id;

    if (job.tailored_resume_id) {
      const { data: tailored } = await authed.client
        .from("tailored_resumes")
        .select("*")
        .eq("id", job.tailored_resume_id)
        .single();
      if (tailored) {
        resumeStructured = tailored.structured as Record<string, unknown> | null;
        rawTextFallback = tailored.rendered_text;
        autoProofPoints = pickRelevantBullets(resumeStructured, job.job_description, 3);
      }
    }
    if (!resumeStructured) {
      const { data: base } = await authed.client
        .from("resumes")
        .select("*")
        .eq("id", job.base_resume_id)
        .single();
      if (base) {
        resumeStructured = base.structured as Record<string, unknown> | null;
        rawTextFallback = base.raw_text;
        autoProofPoints = pickRelevantBullets(resumeStructured, job.job_description, 3);
      }
    }
  } else if (input.base_resume_id) {
    const { data: base, error: baseErr } = await authed.client
      .from("resumes")
      .select("*")
      .eq("id", input.base_resume_id)
      .single();
    if (baseErr || !base) {
      return jsonResponse({ error: "resume_not_found" }, { status: 404 });
    }
    baseResumeId = base.id;
    resumeStructured = base.structured as Record<string, unknown> | null;
    rawTextFallback = base.raw_text;
    autoProofPoints = pickRelevantBullets(resumeStructured, input.job_description, 3);
  }

  // User-supplied proof_points first, then auto-picked bullets, capped at 4.
  const combinedProof = [...(input.proof_points ?? []), ...autoProofPoints].slice(0, 4);

  const isStructured = !!resumeStructured && !resumeStructured.rawTextOnly;
  const resumeBlock = isStructured
    ? `Candidate resume (structured JSON):\n${JSON.stringify(resumeStructured, null, 2)}`
    : `Candidate resume (plaintext):\n${rawTextFallback ?? "(none available)"}`;

  const proofBlock = combinedProof.length
    ? `Proof points (use 2 of these; do not invent others):\n${combinedProof
        .map((p, i) => `${i + 1}. ${p}`)
        .join("\n")}`
    : "Proof points: (none supplied — pull two concrete examples directly from the resume above; do not invent.)";

  const userMessage = [
    resumeBlock,
    `Role title: ${input.role_title}`,
    `Company name: ${input.company_name}`,
    `Job description:\n${input.job_description}`,
    `Tone: ${input.tone}`,
    proofBlock,
  ].join("\n\n");

  // ── Call Llama with one corrective retry ────────────────────────────
  const letterResult = await coerceLetter(userMessage);
  if (!letterResult.ok) {
    return jsonResponse(
      { error: "generation_failed", detail: letterResult.errorSummary },
      { status: 500 },
    );
  }
  const { body, providerModel } = letterResult;

  // ── Insert cover_letters row ────────────────────────────────────────
  const { data: row, error: insertError } = await authed.client
    .from("cover_letters")
    .insert({
      user_id: authed.user.id,
      tailoring_job_id: input.tailoring_job_id ?? null,
      base_resume_id: baseResumeId,
      role_title: input.role_title,
      company_name: input.company_name,
      tone: input.tone,
      body,
      model: providerModel,
      prompt_version: COVER_PROMPT_VERSION,
    } as never)
    .select("*")
    .single();

  if (insertError || !row) {
    return jsonResponse(
      { error: "cover_insert_failed", detail: insertError?.message },
      { status: 500 },
    );
  }

  // ── Link back to the tailoring_job ──────────────────────────────────
  if (input.tailoring_job_id) {
    const { error: linkErr } = await authed.client
      .from("tailoring_jobs")
      .update({ cover_letter_id: row.id } as never)
      .eq("id", input.tailoring_job_id);
    if (linkErr) {
      return jsonResponse({
        cover_letter: row,
        warning: "link_to_job_failed",
        detail: linkErr.message,
      });
    }
  }

  return jsonResponse({ cover_letter: row });
});

// ── Helpers ────────────────────────────────────────────────────────────

type CoerceResult =
  | { ok: true; body: string; providerModel: string }
  | { ok: false; errorSummary: string };

async function coerceLetter(userMessage: string): Promise<CoerceResult> {
  const baseMessages = [
    { role: "system" as const, content: COVER_SYSTEM_PROMPT },
    { role: "user" as const, content: userMessage },
  ];

  const first = await tryParse(baseMessages);
  if (first.ok) return first;

  const corrective = [
    ...baseMessages,
    {
      role: "system" as const,
      content:
        "Your previous response did not match the schema. Validation errors: " +
        first.errorSummary +
        '. Return JSON only: { "body": "<plaintext cover letter, 250-320 words, 3 paragraphs separated by blank lines, no markdown>" }.',
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
      temperature: 0.4,
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

  const validation = CoverLetterBodySchema.safeParse(parsed);
  if (!validation.success) {
    const issues = validation.error.issues
      .slice(0, 4)
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    return { ok: false, errorSummary: issues };
  }
  return { ok: true, body: validation.data.body, providerModel };
}

/**
 * Picks up to `limit` resume bullets that share the most non-stopword tokens
 * with the JD. Lightweight pre-filter — the LLM does the real selection in
 * the prompt; this just keeps us from dumping the entire resume as "proof".
 */
function pickRelevantBullets(
  structured: Record<string, unknown> | null,
  jdText: string,
  limit: number,
): string[] {
  if (!structured) return [];
  const experiences = structured.experiences;
  if (!Array.isArray(experiences)) return [];

  const bullets: string[] = [];
  for (const exp of experiences) {
    if (exp && typeof exp === "object" && Array.isArray((exp as Record<string, unknown>).bullets)) {
      for (const b of (exp as { bullets: unknown[] }).bullets) {
        if (typeof b === "string" && b.length >= 10) bullets.push(b);
      }
    }
  }
  if (bullets.length === 0) return [];

  const jdTokens = new Set(
    jdText
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3),
  );

  const scored = bullets.map((b) => {
    const tokens = b
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3);
    let hits = 0;
    for (const t of tokens) if (jdTokens.has(t)) hits++;
    return { b, hits };
  });
  scored.sort((a, b) => b.hits - a.hits);

  return scored.slice(0, limit).map((s) => s.b);
}
