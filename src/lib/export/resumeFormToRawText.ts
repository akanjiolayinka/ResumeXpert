import type { ResumeFormValues } from "@/lib/schemas/resume";
import type { ResumeStructuredData } from "@/lib/export/ResumeDocument";

function splitLines(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}

function splitCsv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Maps Builder form values to the canonical ResumeStructured shape stored in
 * resumes.structured. Project "results" (which the structured Project shape
 * has no field for) are folded into that project's bullets so nothing is lost.
 */
export function resumeFormToStructured(data: ResumeFormValues): ResumeStructuredData {
  return {
    fullName: data.fullName,
    email: data.email || undefined,
    phone: data.phone || undefined,
    location: data.location || undefined,
    links: {
      linkedin: data.linkedin || undefined,
      portfolio: data.portfolio || undefined,
    },
    summary: data.summary || undefined,
    skills: splitCsv(data.skills),
    experiences: data.experiences.map((e) => ({
      company: e.company,
      role: e.role,
      dates: e.dates,
      bullets: splitLines(e.bullets),
      metrics: splitLines(e.metrics),
    })),
    projects: data.projects.map((p) => ({
      name: p.name,
      link: p.link || undefined,
      stack: p.stack || undefined,
      bullets: [...splitLines(p.bullets), ...splitLines(p.results)],
    })),
    education: data.education.map((ed) => ({
      school: ed.school,
      degree: ed.degree,
      dates: ed.dates,
      gpa: ed.gpa || undefined,
    })),
    certifications: splitLines(data.certifications),
    awards: splitLines(data.awards),
    volunteering: splitLines(data.volunteering),
  };
}

/**
 * Flattens Builder form values into ATS-safe plaintext for resumes.raw_text.
 * Mirrors the edge function's flattenStructured so a manually-built resume and
 * an uploaded one read consistently downstream (tailoring, scoring, export).
 */
export function resumeFormToRawText(data: ResumeFormValues): string {
  const s = resumeFormToStructured(data);
  const lines: string[] = [];

  if (s.fullName) lines.push(s.fullName.toUpperCase());
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

  if (s.skills && s.skills.length) {
    lines.push("SKILLS");
    lines.push("-".repeat(40));
    lines.push(s.skills.join(", "));
    lines.push("");
  }

  if (s.experiences && s.experiences.length) {
    lines.push("EXPERIENCE");
    lines.push("-".repeat(40));
    for (const exp of s.experiences) {
      lines.push(`${exp.role} — ${exp.company} | ${exp.dates}`);
      for (const b of exp.bullets ?? []) lines.push(`• ${b}`);
      for (const m of exp.metrics ?? []) lines.push(`• Impact: ${m}`);
      lines.push("");
    }
  }

  if (s.projects && s.projects.length) {
    lines.push("PROJECTS");
    lines.push("-".repeat(40));
    for (const p of s.projects) {
      lines.push([p.name, p.stack, p.link].filter(Boolean).join(" | "));
      for (const b of p.bullets ?? []) lines.push(`• ${b}`);
      lines.push("");
    }
  }

  if (s.education && s.education.length) {
    lines.push("EDUCATION");
    lines.push("-".repeat(40));
    for (const e of s.education) {
      lines.push(
        `${e.school} — ${e.degree} | ${e.dates}${e.gpa ? ` | ${e.gpa}` : ""}`,
      );
    }
    lines.push("");
  }

  if (s.certifications && s.certifications.length) {
    lines.push("CERTIFICATIONS");
    lines.push("-".repeat(40));
    for (const c of s.certifications) lines.push(`• ${c}`);
    lines.push("");
  }

  if (s.awards && s.awards.length) {
    lines.push("AWARDS");
    lines.push("-".repeat(40));
    for (const a of s.awards) lines.push(`• ${a}`);
    lines.push("");
  }

  if (s.volunteering && s.volunteering.length) {
    lines.push("LEADERSHIP & VOLUNTEERING");
    lines.push("-".repeat(40));
    for (const v of s.volunteering) lines.push(`• ${v}`);
  }

  return lines.join("\n").trim();
}
