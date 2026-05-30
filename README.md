# ResumeXpert

> AI-powered resume tailoring, ATS scoring, cover letters, and career chat for the Nigerian job market.

**Live demo:** YOUR_VERCEL_URL

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](#license)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel&logoColor=white)](https://vercel.com)

---

## What is ResumeXpert

ResumeXpert is an AI-powered resume and career assistant built for the Nigerian job market — and anyone tired of getting filtered out by Applicant Tracking Systems (ATS) before a human ever reads their resume.

The problem it solves: in Nigeria's competitive job market, thousands of qualified graduates and professionals are rejected before they even get an interview — not because they lack skills, but because their resumes fail the first filter. Recruiters use ATS software that scans for specific keywords and formats. If your resume does not match, it gets rejected automatically. Most people never know why.

ResumeXpert fixes this by doing four things in one place:

**Resume Tailoring** — Paste a job description and ResumeXpert uses Llama 3.3 70B (via Groq) to rewrite your resume to match the role. It rephrases bullet points, reorders sections, and emphasizes the right experience. It never invents experience you do not have. Every change is shown in a diff view so you can see exactly what was changed and why.

**ATS Scoring** — After tailoring, your resume is automatically scored against the job description on a 0-100 scale. You get four subscores (keyword match, structure, formatting, impact), a list of missing keywords, and 3-5 specific actionable suggestions tied to the exact section that needs work.

**Cover Letter Generation** — Generate a personalized, role-aligned cover letter in three tones: warm, direct, or enthusiastic. The letter pulls proof points directly from your tailored resume so it stays consistent with what you submitted. Fully editable before you copy or download it.

**AI Career Chat** — A streaming AI career coach that knows your resume and the job you are targeting. Ask it to rewrite a bullet point, explain what skills you are missing, give you interview tips for the role, or review your professional tone. It responds in real time like a chat with a real coach.

How it works end to end:

1. Sign up with your email
2. Upload your existing resume (PDF) or build one from scratch using the form builder
3. Paste the job description for a role you want
4. Click Tailor to this JD — Llama rewrites your resume in 5-15 seconds
5. Review the diff view showing every change and why
6. Check your ATS score and fix the flagged issues
7. Generate a matching cover letter in one click
8. Download your tailored resume as a PDF
9. Chat with the AI coach for interview prep
10. Come back to the dashboard to track all your tailored versions and watch your ATS score improve over time

Who it is for: Nigerian graduates applying for their first job, early-career professionals switching industries, anyone who has sent 50 applications and heard nothing back, job seekers targeting roles at international companies with strict ATS systems, and university career centres helping students.

What makes it different: most resume builders give you a template. ResumeXpert reads the actual job description and rewrites your resume to match it in 10 seconds for free. It shows every change in a diff view with a reason so you learn from it. The AI is constrained by a truthfulness rule: it cannot invent employers, job titles, dates, technologies, certifications, degrees, metrics, or accomplishments not already in your resume. If a job requires a skill you do not have, it surfaces it as a gap with the exact JD line as evidence.

---

## Features

### Core AI features
- **Resume tailoring** — paste a JD, Llama 3.3 70B rewrites the resume; results include a per-section diff and a "skill gaps" list backed by verbatim JD quotes.
- **ATS scoring** — automatic post-tailor score (0-100) with four subscores (keyword, structure, formatting, impact), matched + missing keyword clouds, and 3-5 prioritised, anchored suggestions.
- **Cover letter generation** — three tones (warm / direct / enthusiastic); proof points are pulled from the tailored resume so the letter never claims something the resume does not.
- **Streaming career chat** — token-by-token SSE chat with Llama 3.1 8B; optionally tied to a tailoring job so the assistant has your resume and the JD as context.
- **Resume parsing** — PDF uploads are extracted with `unpdf` and structured by Llama 3.3 70B into a canonical JSON shape; partial parses fall back to a raw-text mode rather than failing.

### Account and auth
- Email / password sign up, sign in, password reset (via Supabase Auth).
- `ProtectedRoute` wraps every authenticated route and bounces unauthenticated users to `/auth/login` with a `?redirect=` back-target.
- Row Level Security on every per-user table — every read and write is constrained server-side by `auth.uid()`.

### Resume management
- Upload PDF resumes (private storage bucket, owner-only object policy).
- Build resumes from scratch with a React Hook Form / Zod builder.
- "Tailor to this JD" path from both the Builder and the dedicated Tailor page.
- Set a default resume; delete with a confirmation dialog (extra warning when deleting the current default).

### Export
- Client-side, ATS-safe PDF export via `@react-pdf/renderer` — real, selectable text (not a screenshot), single-column layout, Helvetica, plain "• " text-prefixed bullets.

### Dashboard and history
- Welcome header with the user's first name (from `profiles.full_name` → email local-part fallback).
- Saved resumes grid with per-card actions (Tailor / Edit / Set default / Delete).
- Tailoring history table with status badges, ATS scores, dates, and per-row PDF export.
- ATS Score History line chart (recharts) — self-hides until two scores exist.
- First-time-user empty state with two onboarding CTAs.

### Settings
- Profile (name, location, links, avatar upload to private bucket).
- Preferences (default cover tone, default resume length, reduce motion, locked "AI never invents experience" trust badge).
- Appearance (Light / Dark / System theme + reduce motion).
- Security (update password, Sign out of this device).
- Data & Privacy (export all data as JSON, delete account with typed `DELETE` confirmation).
- Help & Feedback (support + feature-request submissions).

### Contact
- Public `/contact` form writes to `support_messages` via the `support-message` edge function.

---

## Tech stack

| Layer            | Technology                                                                  | Version |
| ---------------- | --------------------------------------------------------------------------- | ------- |
| Frontend         | React                                                                       | ^18.3.1 |
| Build tool       | Vite                                                                        | ^5.4.19 |
| Language         | TypeScript                                                                  | ^5.8.3  |
| Styling          | Tailwind CSS                                                                | ^3.4.17 |
| UI components    | shadcn/ui (style `default`, slate base)                                     | –       |
| Forms            | React Hook Form                                                             | ^7.61.1 |
| Validation       | Zod                                                                         | ^3.25.76|
| Form / Zod glue  | @hookform/resolvers                                                         | ^3.10.0 |
| Routing          | React Router DOM                                                            | ^6.30.1 |
| Server state     | TanStack Query                                                              | ^5.83.0 |
| Charts           | recharts                                                                    | ^2.15.4 |
| Icons            | lucide-react                                                                | ^0.462.0|
| Backend / DB     | Supabase (Postgres + Auth + Storage + Realtime + Edge Functions)            | ^2.105.4|
| Edge functions   | Deno (Supabase Edge runtime)                                                | –       |
| AI inference     | Groq — Llama 3.3 70B + Llama 3.1 8B                                         | –       |
| PDF export       | @react-pdf/renderer                                                         | ^4.5.1  |
| Testing          | Vitest                                                                      | ^3.2.4  |
| Deployment       | Vercel                                                                      | –       |

---

## Architecture overview

### 1. Frontend organisation

```text
src/
├── App.tsx                      # Router, providers (QueryClient, Auth, Theme, Toaster)
├── main.tsx                     # Vite entry
├── pages/                       # One file per route
│   ├── Index.tsx Features.tsx Pricing.tsx FAQ.tsx About.tsx
│   ├── Contact.tsx Privacy.tsx Terms.tsx Tips.tsx NotFound.tsx
│   ├── Dashboard.tsx ResumeBuilder.tsx ResumeTailor.tsx
│   ├── ATSScan.tsx CoverLetter.tsx Chatbot.tsx Settings.tsx
│   └── auth/{Login,SignUp,ForgotPassword,ResetPassword}.tsx
├── components/
│   ├── auth/ProtectedRoute.tsx  # Route guard backed by AuthContext
│   ├── chat/ContextBadge.tsx
│   ├── common/                  # ScoreMeter, OutputPanel, ThemeToggle, ...
│   ├── cover/CoverLetterEditor.tsx
│   ├── dashboard/               # ResumeCard, TailoringHistoryTable, ATSScoreChart, EmptyDashboard
│   ├── layout/                  # Navbar, MarketingNavbar, Footer, UserMenu, Layout shells
│   ├── tailored/                # DiffView, GapsView, ExportMenu
│   ├── ui/                      # shadcn primitives
│   └── upload/ResumeUploader.tsx
├── contexts/                    # AuthContext, ThemeContext
├── hooks/                       # use-toast, use-mobile
├── lib/
│   ├── supabase.ts              # Supabase client + URL/anon key for raw fetch (chat SSE)
│   ├── queryClient.ts           # TanStack Query defaults (5 min staleTime, retry 1)
│   ├── database.types.ts        # Generated from Supabase schema
│   ├── queries/                 # React Query hooks (resumes, tailoringJobs, atsScores,
│   │                            #  coverLetters, chatSessions, profile, tailoredResumes)
│   ├── realtime/useTailoringJob.ts  # Realtime sub + auto-trigger ATS score on success
│   ├── streaming/useChatStream.ts   # Raw-fetch SSE reader for chat
│   ├── schemas/                 # Zod form schemas (auth, tailor, resume)
│   ├── export/                  # ResumeDocument (react-pdf) + resumeFormToRawText
│   ├── hooks/useResumeUpload.ts # Upload -> storage -> parse-upload pipeline
│   ├── types/resume.ts          # Resume wrapper type (adds parse_failed)
│   ├── sample-profiles.ts       # Builder "Use a sample" data
│   ├── resume-utils.ts          # Legacy helpers still used by Chatbot
│   └── storage.ts utils.ts
└── test/                        # Vitest setup + smoke tests
```

### 2. Backend — Supabase edge functions

All edge functions live under `supabase/functions/` and run in the Deno runtime. Per-user edge functions verify the JWT and use a user-scoped Supabase client so every read/write is still gated by RLS; the service-role client (`_shared/admin.ts`) is used only where strictly necessary.

| Function                | Purpose                                                                                                                                            | Model         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `parse-upload`          | Verifies storage ownership, extracts text (PDF via `unpdf`, DOCX via `mammoth`), coerces to `ResumeStructured` JSON, inserts a `resumes` row.       | Llama 3.3 70B |
| `tailor-resume`         | Idempotent pipeline: pending → running → succeeded/failed. Writes a `tailored_resumes` row with `diffs` and `gaps` arrays.                          | Llama 3.3 70B |
| `score-ats`             | Accepts `{ tailoring_job_id }` or `{ resume_id, job_description? }`. Pre-computes keyword overlap, feeds it to the LLM as ground truth, persists `ats_scores`. | Llama 3.3 70B |
| `generate-cover-letter` | Pulls 2-3 JD-relevant bullets as auto proof points, combines with user-supplied ones, writes a `cover_letters` row.                                  | Llama 3.3 70B |
| `chat`                  | Streams an SSE response (`{ delta }` per token, `{ done, session_id, assistant_message_id }` final). Optional tailoring-job context.                | Llama 3.1 8B  |

### 3. Auth flow

`src/contexts/AuthContext.tsx` calls `supabase.auth.getSession()` on mount and subscribes to `onAuthStateChange`. It exposes `{ user, session, loading }`. `src/components/auth/ProtectedRoute.tsx` shows a spinner while `loading`, then either renders its children or `<Navigate to="/auth/login?redirect=...">`. Sign in / sign up live under `/auth/login` and `/auth/signup`; password reset uses `VITE_APP_URL` to build the redirect URL.

### 4. AI call flow

`supabase/functions/_shared/llama.ts` exposes `chatCompletion` (buffered) and `streamChatCompletion` (used by `chat`). Both:

- Call Groq's OpenAI-compatible Chat Completions endpoint first.
- On `429`, retry once after `Retry-After`; on a second `429`, optionally fail over to Together AI with a model-id remap (`opts.fallback === true`); otherwise throw `AIUnavailableError`.
- On `5xx`, retry once after 1s; on a second `5xx`, throw `AIUnavailableError`.
- Return the upstream provider name on the result so it can be persisted (`groq:llama-3.3-70b-versatile` vs `together:meta-llama/Llama-3.3-70B-Instruct-Turbo`) for traceability on each row's `model` column.

Per-user rate limits are enforced in-function by counting recent rows — see `_shared/limits.ts` (e.g. `MAX_CHAT_MESSAGES_PER_DAY = 100`, `MAX_TAILORINGS_PER_DAY = 20`).

### 5. Data flow — the tailoring pipeline

```text
1. User uploads PDF
   └─> POST → parse-upload edge function
       └─> ownership check on storage path
       └─> unpdf / mammoth → plaintext
       └─> Llama 3.3 70B (parse.v1) → ResumeStructured JSON
       └─> INSERT into resumes (source_kind='upload')

2. User pastes JD on /resume-tailor (or Tailor to this JD in Builder)
   └─> INSERT tailoring_jobs (status='pending')
   └─> POST → tailor-resume edge function
       └─> idempotency guard (running→409, succeeded→return existing)
       └─> UPDATE tailoring_jobs status='running'      ← first DB write
       └─> Llama 3.3 70B (tailor.v1, JSON mode, one corrective retry)
       └─> validate against TailoredResumeStructuredSchema
       └─> INSERT tailored_resumes (with diffs + gaps arrays in jsonb)
       └─> UPDATE tailoring_jobs status='succeeded', tailored_resume_id

3. Client receives Realtime UPDATE on tailoring_jobs row
   └─> useTailoringJob auto-fires useScoreResume({ tailoring_job_id })
       └─> POST → score-ats edge function
           └─> computeKeywordOverlap → fed to Llama as ground truth
           └─> Llama 3.3 70B (score.v1) → ATSScoreOutput JSON
           └─> INSERT ats_scores
           └─> UPDATE tailoring_jobs.ats_score_id
```

### 6. Database schema summary

Defined in `supabase/migrations/0001_init.sql` (plus the `parse_failed` addition in `0002_resumes_parse_failed.sql`). Ten tables, all with RLS enabled. Per-user tables use a single `*_self_all` policy gating on `auth.uid() = user_id`; `profiles` uses self-select + self-update; submission tables (`support_messages`, `waitlist_signups`) are insert-allowed for anyone, read service-role only.

| Table              | One-line purpose                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `profiles`         | App-level mirror of `auth.users`; identity + preference fields. Created by signup trigger.    |
| `resumes`          | Base resumes — uploaded (PDF in storage) or built manually. Owns `raw_text` + `structured`.   |
| `tailoring_jobs`   | One row per "user pasted a JD". Tracks `pending` / `running` / `succeeded` / `failed`.        |
| `tailored_resumes` | LLM output of a tailoring job. `structured` jsonb includes the `diffs` and `gaps` arrays.     |
| `ats_scores`       | One row per ATS scan. Stores `overall`, `subscores` jsonb, `suggestions` jsonb, keyword arrays.|
| `cover_letters`    | Generated cover letters. Body is editable in place.                                            |
| `chat_sessions`    | Optional `tailoring_job_id` link so a session inherits resume + JD context.                    |
| `chat_messages`    | Persisted user + assistant messages (assistant inserted after stream closes).                  |
| `support_messages` | Submissions from `/contact` and Settings → Help. `kind in ('support','feature_request')`.      |
| `waitlist_signups` | `/pricing` Pro/Team CTA. Anonymous insert allowed; reads service-role only.                    |

Storage: a single private bucket `resume-uploads`, owner-only policy keyed on `(storage.foldername(name))[1] = auth.uid()::text`. Used for uploaded resume files and the user avatar (`{user_id}/avatar.png`).

---

## Getting started

### Prerequisites

- Node.js 18+ and npm (Vite 5 requires Node 18+).
- A Supabase project (free tier is fine).
- A Groq API key (free tier is fine; Together AI key optional for failover).
- The Supabase CLI for type generation and local edge-function dev.

### Setup

```bash
git clone https://github.com/akanjiolayinka/ResumeXpert.git
cd ResumeXpert
npm install
cp .env.example .env.local
# Fill in .env.local — see the env var reference below.
```

Apply the database migrations:

```bash
# In the Supabase Dashboard:
#   SQL Editor → New query
#   Paste contents of supabase/migrations/0001_init.sql → Run
#   Paste contents of supabase/migrations/0002_resumes_parse_failed.sql → Run
```

Generate Supabase TypeScript types:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

Deploy edge functions (one-off; re-run when a function changes):

```bash
npx supabase functions deploy parse-upload
npx supabase functions deploy tailor-resume
npx supabase functions deploy score-ats
npx supabase functions deploy generate-cover-letter
npx supabase functions deploy chat
```

Start the dev server:

```bash
npm run dev
# App runs at http://localhost:8080
```

---

## Available scripts

From `package.json`:

| Script                | What it does                                                |
| --------------------- | ----------------------------------------------------------- |
| `npm run dev`         | Starts the Vite dev server on port 8080.                    |
| `npm run build`       | Production build into `dist/`.                              |
| `npm run build:dev`   | Vite build in development mode (sourcemaps, no minification).|
| `npm run lint`        | ESLint over the whole project.                              |
| `npm run preview`     | Serves the production build locally.                        |
| `npm test`            | Runs Vitest once (CI).                                      |
| `npm run test:watch`  | Runs Vitest in watch mode.                                  |

---

## Database schema

Defined in `supabase/migrations/0001_init.sql` (10 tables, all RLS-enabled) and `supabase/migrations/0002_resumes_parse_failed.sql` (adds `resumes.parse_failed`). Highlights:

- `profiles` — RLS: `profiles_self_select`, `profiles_self_update` (`auth.uid() = id`). Insert is performed by the `handle_new_user` `SECURITY DEFINER` trigger, no client insert policy.
- `resumes`, `tailoring_jobs`, `tailored_resumes`, `ats_scores`, `cover_letters`, `chat_sessions`, `chat_messages` — single `*_self_all` policy gating on `auth.uid() = user_id`.
- `support_messages` — insert policy allows anyone (`user_id = auth.uid()` when authed, `NULL` when not). No select policy → reads service-role only.
- `waitlist_signups` — same model as `support_messages`.
- A `tailoring_status` enum is used by `tailoring_jobs.status`.
- Storage bucket `resume-uploads` is private; the `resume_uploads_owner_rw` policy gates by the first folder segment of the object name.

---

## Edge functions

All under `supabase/functions/`. All require an `Authorization: Bearer <jwt>` header; CORS is handled per-function.

### `parse-upload`
- **Purpose:** verify storage ownership, extract text, structure it with Llama, insert a `resumes` row.
- **Input:** `{ resume_id: uuid, storage_path: string, mime: 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label?: string }`
- **Output:** `{ resume_id: uuid }`
- **Auth required:** yes.
- **Model:** Llama 3.3 70B (`parse.v1`).

### `tailor-resume`
- **Purpose:** run the tailoring pipeline for a given job.
- **Input:** `{ tailoring_job_id: uuid }`
- **Output:** `{ tailored_resume, tailoring_job, prompt_version }`
- **Auth required:** yes.
- **Model:** Llama 3.3 70B (`tailor.v1`, JSON mode, one corrective retry).

### `score-ats`
- **Purpose:** score a tailored or base resume against a JD.
- **Input:** `{ tailoring_job_id: uuid }` OR `{ resume_id: uuid, job_description?: string }`
- **Output:** `{ ats_score }`
- **Auth required:** yes.
- **Model:** Llama 3.3 70B (`score.v1`).

### `generate-cover-letter`
- **Purpose:** write a tailored cover letter grounded in the resume and (optionally) auto-picked proof points.
- **Input:** `{ tailoring_job_id?, base_resume_id?, role_title, company_name, job_description, tone: 'warm' | 'direct' | 'enthusiastic', proof_points?: string[] }` (at least one of `tailoring_job_id` / `base_resume_id` required).
- **Output:** `{ cover_letter }`
- **Auth required:** yes.
- **Model:** Llama 3.3 70B (`cover.v1`).

### `chat`
- **Purpose:** streamed career-coach chat optionally grounded in a tailoring job.
- **Input:** `{ message: string (1-2000), session_id?: uuid, tailoring_job_id?: uuid }`
- **Output:** SSE stream of `data: {"delta":"…"}` lines, ending with `data: {"done":true,"session_id":"…","assistant_message_id":"…"}`. Mid-stream errors arrive as `data: {"error":"…"}`. Includes a 24h per-user rate limit (`429 rate_limited`).
- **Auth required:** yes.
- **Model:** Llama 3.1 8B (`chat.v1`, streaming).

---

## Deployment

### Vercel (frontend)

1. Connect this GitHub repo to a new Vercel project.
2. Framework preset: **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add the three browser-safe environment variables (see the reference below):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_URL` (set to your Vercel URL after first deploy)
6. Deploy.
7. After the first deploy, update `VITE_APP_URL` to your real Vercel URL and redeploy.
8. In Supabase Dashboard → **Authentication → URL Configuration**, set the Site URL and add the Vercel URL to Redirect URLs so password-reset emails point at the right place.

### Supabase (backend)

1. Create a new Supabase project.
2. Run `0001_init.sql` and `0002_resumes_parse_failed.sql` via the SQL Editor.
3. Add Edge Function secrets in **Project Settings → Edge Functions → Secrets**:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GROQ_API_KEY`
   - `TOGETHER_API_KEY` (optional)
4. Deploy edge functions (`npx supabase functions deploy …`) — see "Getting started".
5. Enable email auth. For dev convenience you can disable the email-confirmation requirement.

---

## Environment variables reference

Every variable defined in `.env.example`:

| Variable                     | Required             | Safe for browser           | Where to get it                                                  | Used by                                                                                  |
| ---------------------------- | -------------------- | -------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`          | Yes                  | Yes                        | Supabase Dashboard → Project Settings → API → "Project URL"      | `src/lib/supabase.ts`                                                                    |
| `VITE_SUPABASE_ANON_KEY`     | Yes                  | Yes (RLS protects data)    | Supabase Dashboard → Project Settings → API → "anon public"      | `src/lib/supabase.ts`, raw-fetch chat client                                              |
| `VITE_APP_URL`               | Yes                  | Yes                        | Your deployed URL (or `http://localhost:8080` for dev)           | `src/pages/auth/ForgotPassword.tsx` (builds password-reset redirect URL)                  |
| `SUPABASE_URL`               | Yes (edge functions) | Yes (same URL)             | Same as `VITE_SUPABASE_URL`                                      | `supabase/functions/_shared/client.ts`, `supabase/functions/_shared/admin.ts`             |
| `SUPABASE_ANON_KEY`          | Yes (edge functions) | Yes (same key)             | Same as `VITE_SUPABASE_ANON_KEY`                                 | `supabase/functions/_shared/client.ts`                                                    |
| `SUPABASE_SERVICE_ROLE_KEY`  | Yes (edge functions) | **NO**                     | Supabase Dashboard → Project Settings → API → "service_role"     | `supabase/functions/_shared/admin.ts` (signup trigger, parse-upload storage read, anonymous inserts) |
| `GROQ_API_KEY`               | Yes (edge functions) | **NO**                     | https://console.groq.com → API Keys                              | `supabase/functions/_shared/llama.ts`                                                     |
| `TOGETHER_API_KEY`           | No (optional)        | **NO**                     | https://api.together.xyz/settings/api-keys                       | `supabase/functions/_shared/llama.ts` (failover)                                          |
| `RUN_AI_TESTS`               | No (CI only)         | n/a                        | Set `1` in your nightly CI job                                   | `src/test/truthfulness.test.ts` (added later in I10)                                       |

`VITE_`-prefixed variables are shipped in the browser bundle. Bare names (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `TOGETHER_API_KEY`) are read by the Deno edge runtime only and are duplicated in `.env.local` solely so you can run edge functions locally with the Supabase CLI.

---

## Contributing

1. Fork the repo and clone your fork.
2. Create a branch using a kebab-case descriptive name:
   - `feature/ats-improvements`
   - `fix/chat-reconnect`
   - `docs/setup-guide`
3. Make your changes. Keep diffs focused — one task per PR.
4. Run the checks locally before submitting:

   ```bash
   npm run lint
   npm test
   npm run build
   ```

5. Open a PR. The description must include:
   - **Summary** — what changed and why, in 1-2 sentences.
   - **Files changed** — a short list with one-line notes.
   - **Verification block** — `tsc` clean, lint clean, build succeeds, smoke-test result.
   - **Kill-list items closed** — if any.

---

## Known limitations (v1)

Intentionally deferred to v1.1:

- Google OAuth (email/password only in v1).
- DOCX file upload parsing (PDF only in v1).
- DOCX resume export (PDF only in v1).
- Multi-session chat UI sidebar (single session in v1).
- Real billing and paid plans (the waitlist captures demand).
- Two-factor authentication.
- Email notification pipeline.
- Together AI fallback (optional, not wired by default).
- pgvector semantic search and embeddings.
- Periodic chat history summarization.
- Active sessions list in Security settings.

---

## License

MIT License

Copyright (c) 2026 Olayinka Akanji

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
