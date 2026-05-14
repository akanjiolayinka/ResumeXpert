-- ResumeTailor — resumes.parse_failed flag (Fi2)
--
-- Adds a boolean flag that the parse-upload edge function sets to true when
-- LLM-coercion of the extracted resume text into ResumeStructured fails
-- twice. The row is still inserted (with whatever raw text we extracted) so
-- the user can salvage their upload by filling in the missing structured
-- sections manually; the UI keys off this flag to show the corresponding
-- prompt.

alter table public.resumes
  add column parse_failed boolean not null default false;

comment on column public.resumes.parse_failed is
  'Soft-fail flag set by parse-upload when LLM coercion to ResumeStructured fails. When true, structured is a minimal { rawTextOnly: true, fullName: <guess> } shape rather than the full canonical structure.';
