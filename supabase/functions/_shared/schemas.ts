// Zod schemas for every edge-function input/output and for the canonical
// resume shapes. Imported by edge functions on Deno; safe to also import from
// client code via a thin re-export wrapper if/when needed.
//
// Versioning: when any of these shapes change in a way that affects already-
// stored rows, bump the relevant prompt_version constant in prompts.ts and
// add a migration. The shape lives here; the rationale lives there.

import { z } from "npm:zod@3";

// ── Building blocks ────────────────────────────────────────────────────────

export const SuggestionSchema = z.object({
  priority: z.enum(["high", "medium", "low"]),
  text: z.string().min(1),
  // Section/bullet anchor, e.g. "experience[0].bullets[2]" or "summary".
  anchor: z.string().optional(),
});
export type Suggestion = z.infer<typeof SuggestionSchema>;

export const ExperienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  dates: z.string(),
  bullets: z.array(z.string()).default([]),
  metrics: z.array(z.string()).optional(),
});
export type Experience = z.infer<typeof ExperienceSchema>;

export const ProjectSchema = z.object({
  name: z.string(),
  link: z.string().optional(),
  stack: z.string().optional(),
  bullets: z.array(z.string()).default([]),
});
export type Project = z.infer<typeof ProjectSchema>;

export const EducationSchema = z.object({
  school: z.string(),
  degree: z.string(),
  dates: z.string(),
  gpa: z.string().optional(),
});
export type Education = z.infer<typeof EducationSchema>;

// ── Canonical resume shapes ────────────────────────────────────────────────

export const ResumeStructuredSchema = z.object({
  fullName: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  links: z
    .object({
      linkedin: z.string().optional(),
      portfolio: z.string().optional(),
      other: z.array(z.string()).optional(),
    })
    .default({}),
  summary: z.string().optional(),
  skills: z.array(z.string()).default([]),
  experiences: z.array(ExperienceSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  education: z.array(EducationSchema).default([]),
  certifications: z.array(z.string()).default([]),
  awards: z.array(z.string()).default([]),
  volunteering: z.array(z.string()).default([]),
});
export type ResumeStructured = z.infer<typeof ResumeStructuredSchema>;

export const DiffEntrySchema = z.object({
  section: z.enum([
    "summary",
    "skills",
    "experience",
    "project",
    "education",
    "certifications",
    "awards",
    "volunteering",
  ]),
  indexInSection: z.number().int().nonnegative().optional(),
  original: z.string(),
  tailored: z.string(),
  changeReason: z.string().min(1),
});
export type DiffEntry = z.infer<typeof DiffEntrySchema>;

export const GapEntrySchema = z.object({
  skill: z.string().min(1),
  evidence: z.string().min(1), // verbatim quote from the JD
});
export type GapEntry = z.infer<typeof GapEntrySchema>;

export const TailoredResumeStructuredSchema = ResumeStructuredSchema.extend({
  diffs: z.array(DiffEntrySchema).default([]),
  gaps: z.array(GapEntrySchema).default([]),
});
export type TailoredResumeStructured = z.infer<typeof TailoredResumeStructuredSchema>;

// ── ATS score output ───────────────────────────────────────────────────────

export const ATSSubscoresSchema = z.object({
  keyword: z.number().int().min(0).max(100),
  structure: z.number().int().min(0).max(100),
  formatting: z.number().int().min(0).max(100),
  impact: z.number().int().min(0).max(100),
});
export type ATSSubscores = z.infer<typeof ATSSubscoresSchema>;

export const ATSScoreOutputSchema = z.object({
  overall: z.number().int().min(0).max(100),
  subscores: ATSSubscoresSchema,
  // 3-5 prioritized suggestions. score-ats enforces this; the LLM is told
  // the same limit in the prompt.
  suggestions: z.array(SuggestionSchema).min(3).max(5),
  reasoning: z.string().max(800).optional(),
});
export type ATSScoreOutput = z.infer<typeof ATSScoreOutputSchema>;

// ── Per-function input/output ──────────────────────────────────────────────

// tailor-resume
// The frontend inserts the tailoring_jobs row (status='pending') first, then
// calls this function with its id. Idempotency: function refuses to act if
// status is already 'running' or 'succeeded' (see tightening note #2).
export const TailorInputSchema = z.object({
  tailoring_job_id: z.string().uuid(),
});
export type TailorInput = z.infer<typeof TailorInputSchema>;

export const TailorOutputSchema = z.object({
  tailored_resume_id: z.string().uuid(),
  tailoring_job_id: z.string().uuid(),
});
export type TailorOutput = z.infer<typeof TailorOutputSchema>;

// score-ats
// Two shapes: tied to a tailoring_job, or standalone against a base resume.
// JD is optional in the standalone case; subscores.keyword reflects "no JD"
// when absent.
export const ScoreInputSchema = z.union([
  z.object({ tailoring_job_id: z.string().uuid() }),
  z.object({
    resume_id: z.string().uuid(),
    job_description: z.string().optional(),
  }),
]);
export type ScoreInput = z.infer<typeof ScoreInputSchema>;

export const ScoreOutputSchema = z.object({
  ats_score_id: z.string().uuid(),
});
export type ScoreOutput = z.infer<typeof ScoreOutputSchema>;

// generate-cover-letter
export const CoverInputSchema = z.object({
  tailoring_job_id: z.string().uuid().optional(),
  base_resume_id: z.string().uuid().optional(),
  role_title: z.string().min(1),
  company_name: z.string().min(1),
  job_description: z.string().min(50),
  tone: z.enum(["warm", "direct", "enthusiastic"]),
  proof_points: z.array(z.string().min(10)).max(4).optional(),
});
export type CoverInput = z.infer<typeof CoverInputSchema>;

export const CoverOutputSchema = z.object({
  cover_letter_id: z.string().uuid(),
});
export type CoverOutput = z.infer<typeof CoverOutputSchema>;

// Body shape returned by the LLM (the function persists this as
// cover_letters.body).
export const CoverLetterBodySchema = z.object({
  body: z.string().min(50),
});

// parse-upload
// resume_id is client-generated (tightening note #5) so the storage path can
// include it before the row exists; the function inserts the row with this id.
export const ParseUploadInputSchema = z.object({
  resume_id: z.string().uuid(),
  storage_path: z.string().min(1),
  mime: z.enum([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]),
  label: z.string().optional(),
});
export type ParseUploadInput = z.infer<typeof ParseUploadInputSchema>;

export const ParseUploadOutputSchema = z.object({
  resume_id: z.string().uuid(),
});
export type ParseUploadOutput = z.infer<typeof ParseUploadOutputSchema>;

// chat
// Returns an SSE stream; the per-event shape is `{ delta: string }` during
// the stream and `{ done: true, session_id, assistant_message_id }` at end.
// No JSON output schema is defined here because the response is streamed.
export const ChatInputSchema = z.object({
  session_id: z.string().uuid().optional(),
  tailoring_job_id: z.string().uuid().optional(),
  message: z.string().min(1).max(2000),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;
