-- ─────────────────────────────────────────────────────────────────────────────
-- ResumeTailor — initial schema (Phase 2 task F2)
--
-- Creates every table, RLS policy, trigger, realtime publication entry, and
-- storage bucket required by v1. Designed to be applied once via the Supabase
-- SQL Editor against a fresh project. Re-running will error on the first
-- `create table` for an already-existing relation — that is intentional, so a
-- partial re-apply does not silently mutate state.
--
-- Order:
--   1. Extensions
--   2. Enums
--   3. Tables (dependency order; forward references handled later)
--   4. Forward-reference FK constraints
--   5. Indexes not declared inline
--   6. Functions
--   7. Triggers
--   8. RLS enable + policies (per table, one policy per role/action group)
--   9. Realtime publication adds
--  10. Storage bucket + storage.objects policies
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Extensions ───────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";          -- gen_random_uuid()


-- ── 2. Enums ────────────────────────────────────────────────────────────────

-- Lifecycle of a tailoring job:
--   pending   — row created by the client; not yet picked up
--   running   — edge function has started work (set on its first DB write)
--   succeeded — finished with a tailored_resume linked
--   failed    — edge function aborted; error_message populated
-- `completed_at` is set when status transitions to succeeded or failed.
create type public.tailoring_status as enum ('pending', 'running', 'succeeded', 'failed');
comment on type public.tailoring_status is
  'Tailoring pipeline state machine: pending -> running -> succeeded | failed.';


-- ── 3. Tables ───────────────────────────────────────────────────────────────

-- profiles ────────────────────────────────────────────────────────────────────
-- App-level mirror of auth.users. One row per registered user, created by the
-- on_auth_user_created trigger. Holds identity + preference fields.
-- profiles.full_name is the canonical user identity (used in nav/avatar);
-- resumes.structured -> fullName is per-resume and intentionally separate.
create table public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  full_name             text,
  location              text,
  linkedin_url          text,
  portfolio_url         text,
  avatar_url            text,
  -- Inline preferences (kept here rather than a separate table per v1 audit)
  default_cover_tone    text not null default 'direct'
                         check (default_cover_tone in ('warm', 'direct', 'enthusiastic')),
  default_resume_length smallint not null default 1
                         check (default_resume_length in (1, 2)),
  reduce_motion         boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- resumes ─────────────────────────────────────────────────────────────────────
-- Base resumes owned by the user. source_kind='upload' rows reference a file
-- in storage (resume-uploads bucket); source_kind='manual' rows were built via
-- the Resume Builder form. raw_text is the flattened plaintext used as LLM
-- input and for downstream scoring.
create table public.resumes (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  label               text not null default 'My resume',
  source_kind         text not null check (source_kind in ('upload', 'manual')),
  source_storage_path text,                       -- e.g. '{user_id}/{resume_id}.pdf'
  source_mime         text,
  raw_text            text not null,
  structured          jsonb not null,             -- ResumeStructured shape
  is_default          boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- tailoring_jobs ──────────────────────────────────────────────────────────────
-- One row per "user pasted a JD and we ran the pipeline." Forward FKs to
-- tailored_resumes / ats_scores / cover_letters are added after those tables
-- exist. See section 4 below.
create table public.tailoring_jobs (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  base_resume_id      uuid not null references public.resumes(id) on delete cascade,
  role_title          text,
  company_name        text,
  job_description     text not null,
  status              public.tailoring_status not null default 'pending',
  error_message       text,
  tailored_resume_id  uuid,                       -- FK added in §4
  ats_score_id        uuid,                       -- FK added in §4
  cover_letter_id     uuid,                       -- FK added in §4
  created_at          timestamptz not null default now(),
  completed_at        timestamptz
);

-- tailored_resumes ────────────────────────────────────────────────────────────
-- Output of the tailor-resume edge function. Immutable (no updated_at).
create table public.tailored_resumes (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  base_resume_id    uuid not null references public.resumes(id) on delete cascade,
  tailoring_job_id  uuid not null references public.tailoring_jobs(id) on delete cascade,
  structured        jsonb not null,               -- TailoredResumeStructured (incl. diffs, gaps)
  rendered_text     text not null,                -- flattened plaintext for ATS + export
  model             text not null,                -- e.g. 'groq:llama-3.3-70b-versatile'
  prompt_version    text not null,                -- e.g. 'tailor.v1'
  created_at        timestamptz not null default now()
);

-- ats_scores ──────────────────────────────────────────────────────────────────
-- One score row per scan. May be tied to a tailoring_job (post-tailor scan) OR
-- to a base resume directly (standalone /ats-scan flow). REVISION from
-- Phase 1.5 §2.5: tailoring_job_id is nullable, base_resume_id added,
-- CHECK constraint requires at least one anchor.
create table public.ats_scores (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  tailoring_job_id  uuid references public.tailoring_jobs(id) on delete cascade,
  base_resume_id    uuid references public.resumes(id) on delete cascade,
  scored_resume_id  uuid references public.tailored_resumes(id) on delete cascade,
  overall           smallint not null check (overall between 0 and 100),
  subscores         jsonb not null,
  suggestions       jsonb not null,
  missing_keywords  text[] not null default '{}',
  matched_keywords  text[] not null default '{}',
  model             text not null,
  prompt_version    text not null,
  created_at        timestamptz not null default now(),
  constraint ats_scores_anchor_chk
    check (tailoring_job_id is not null or base_resume_id is not null)
);

-- cover_letters ───────────────────────────────────────────────────────────────
-- Tone vocabulary locked to warm | direct | enthusiastic per v1 audit decision.
create table public.cover_letters (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  tailoring_job_id  uuid references public.tailoring_jobs(id) on delete set null,
  base_resume_id    uuid references public.resumes(id) on delete set null,
  role_title        text not null,
  company_name      text not null,
  tone              text not null check (tone in ('warm', 'direct', 'enthusiastic')),
  body              text not null,
  model             text not null,
  prompt_version    text not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- chat_sessions ───────────────────────────────────────────────────────────────
create table public.chat_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  tailoring_job_id  uuid references public.tailoring_jobs(id) on delete set null,
  title             text not null default 'New chat',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- chat_messages ───────────────────────────────────────────────────────────────
-- user_id is denormalized (vs. joining through chat_sessions) so the RLS
-- policy can check ownership without a join.
create table public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.chat_sessions(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant', 'system')),
  content     text not null,
  model       text,                                -- null for user messages
  created_at  timestamptz not null default now()
);

-- support_messages ────────────────────────────────────────────────────────────
-- One table for the marketing /contact form, the Settings → Help "Contact
-- support" form, and the Settings → Help feature-request form. Tagged by
-- `kind`. Contact submissions (anonymous + auth'd) use 'support'.
-- Read access is service-role only (no SELECT policy).
create table public.support_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  kind        text not null check (kind in ('support', 'feature_request')),
  name        text,                                -- populated for anonymous Contact submissions
  email       text,                                -- populated for anonymous Contact submissions
  message     text not null,
  created_at  timestamptz not null default now()
);

-- waitlist_signups ────────────────────────────────────────────────────────────
-- /pricing Pro/Team CTA. Anonymous insert allowed. Read is service-role only.
create table public.waitlist_signups (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,
  email           text not null,
  tier_requested  text not null check (tier_requested in ('pro', 'team')),
  created_at      timestamptz not null default now()
);


-- ── 4. Forward-reference FK constraints ─────────────────────────────────────

alter table public.tailoring_jobs
  add constraint tailoring_jobs_tailored_resume_fk
    foreign key (tailored_resume_id)
    references public.tailored_resumes(id)
    on delete set null;

alter table public.tailoring_jobs
  add constraint tailoring_jobs_ats_score_fk
    foreign key (ats_score_id)
    references public.ats_scores(id)
    on delete set null;

alter table public.tailoring_jobs
  add constraint tailoring_jobs_cover_letter_fk
    foreign key (cover_letter_id)
    references public.cover_letters(id)
    on delete set null;


-- ── 5. Indexes ──────────────────────────────────────────────────────────────

-- profiles is keyed on auth.users.id directly; no extra indexes needed.

create index resumes_user_idx           on public.resumes(user_id);
create unique index resumes_one_default_per_user
                                        on public.resumes(user_id) where is_default;

create index tailoring_jobs_user_idx    on public.tailoring_jobs(user_id, created_at desc);
create index tailoring_jobs_status_idx  on public.tailoring_jobs(status);

create index tailored_resumes_job_idx   on public.tailored_resumes(tailoring_job_id);
create index tailored_resumes_user_idx  on public.tailored_resumes(user_id);

create index ats_scores_job_idx         on public.ats_scores(tailoring_job_id);
create index ats_scores_resume_idx      on public.ats_scores(base_resume_id);
create index ats_scores_user_idx        on public.ats_scores(user_id, created_at desc);

create index cover_letters_user_idx     on public.cover_letters(user_id, created_at desc);
create index cover_letters_job_idx      on public.cover_letters(tailoring_job_id);

create index chat_sessions_user_idx     on public.chat_sessions(user_id, updated_at desc);
create index chat_messages_session_idx  on public.chat_messages(session_id, created_at);

create index support_messages_user_idx  on public.support_messages(user_id, created_at desc);
create index waitlist_signups_email_idx on public.waitlist_signups(email);


-- ── 6. Functions ────────────────────────────────────────────────────────────

-- Create a profiles row when a new auth.users row appears. SECURITY DEFINER so
-- the function can write to public.profiles regardless of who is signing up;
-- search_path is pinned to public to avoid search_path injection.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

-- Generic updated_at touch.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ── 7. Triggers ─────────────────────────────────────────────────────────────

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger resumes_updated_at
  before update on public.resumes
  for each row execute function public.set_updated_at();

create trigger cover_letters_updated_at
  before update on public.cover_letters
  for each row execute function public.set_updated_at();

create trigger chat_sessions_updated_at
  before update on public.chat_sessions
  for each row execute function public.set_updated_at();


-- ── 8. Row Level Security ───────────────────────────────────────────────────

alter table public.profiles         enable row level security;
alter table public.resumes          enable row level security;
alter table public.tailoring_jobs   enable row level security;
alter table public.tailored_resumes enable row level security;
alter table public.ats_scores       enable row level security;
alter table public.cover_letters    enable row level security;
alter table public.chat_sessions    enable row level security;
alter table public.chat_messages    enable row level security;
alter table public.support_messages enable row level security;
alter table public.waitlist_signups enable row level security;

-- profiles ───── insert handled by trigger using SECURITY DEFINER; no insert
-- policy is exposed to clients. Owner can select + update their own row.
create policy profiles_self_select on public.profiles
  for select using (auth.uid() = id);
create policy profiles_self_update on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Owner-only full access on the per-user resource tables.
create policy resumes_self_all on public.resumes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy tailoring_jobs_self_all on public.tailoring_jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy tailored_resumes_self_all on public.tailored_resumes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy ats_scores_self_all on public.ats_scores
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy cover_letters_self_all on public.cover_letters
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy chat_sessions_self_all on public.chat_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy chat_messages_self_all on public.chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- support_messages: insert allowed for anyone. Anonymous submissions have
-- user_id NULL; authenticated submissions must set user_id = auth.uid().
-- No SELECT policy → reads are service-role only.
create policy support_messages_insert on public.support_messages
  for insert
  with check (
    (auth.uid() is null and user_id is null)
    or (auth.uid() is not null and user_id = auth.uid())
  );

-- waitlist_signups: same insert pattern (anon or auth'd may submit).
create policy waitlist_signups_insert on public.waitlist_signups
  for insert
  with check (
    (auth.uid() is null and user_id is null)
    or (auth.uid() is not null and user_id = auth.uid())
  );


-- ── 9. Realtime publication ─────────────────────────────────────────────────

-- Frontend subscribes to tailoring_jobs row status transitions
-- (pending -> running -> succeeded | failed) and to chat_messages so
-- assistant tokens appear without a refetch.
alter publication supabase_realtime add table public.tailoring_jobs;
alter publication supabase_realtime add table public.chat_messages;


-- ── 10. Storage bucket + policies ───────────────────────────────────────────

-- Private bucket. Object path convention:
--   '{user_id}/{resume_id}.pdf'   for uploaded resumes
--   '{user_id}/avatar.png'        for profile avatars
-- The owner-only policy keys off (storage.foldername(name))[1] = user_id.
insert into storage.buckets (id, name, public)
values ('resume-uploads', 'resume-uploads', false)
on conflict (id) do nothing;

create policy resume_uploads_owner_rw on storage.objects
  for all
  using (
    bucket_id = 'resume-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'resume-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
