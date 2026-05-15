import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Subset of TailoredResumeStructured used by this component. We don't import
// the edge-shared Zod type here because supabase/functions/ is excluded from
// the Vite tsconfig — the diff entries are just plain objects on the row's
// `structured` jsonb column.
export type DiffEntry = {
  section:
    | "summary"
    | "skills"
    | "experience"
    | "project"
    | "education"
    | "certifications"
    | "awards"
    | "volunteering";
  indexInSection?: number;
  original: string;
  tailored: string;
  changeReason: string;
};

const SECTION_LABEL: Record<DiffEntry["section"], string> = {
  summary: "Summary",
  skills: "Skills",
  experience: "Experience",
  project: "Projects",
  education: "Education",
  certifications: "Certifications",
  awards: "Awards",
  volunteering: "Volunteering",
};

type Props = {
  diffs: DiffEntry[];
};

export function DiffView({ diffs }: Props) {
  if (diffs.length === 0) {
    return (
      <div className="p-6 flex items-start gap-3 rounded-lg bg-muted/30">
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">No changes were needed</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your resume already matches this role well. You can still review the skill
            gaps tab for development suggestions.
          </p>
        </div>
      </div>
    );
  }

  // Group by section so a long resume produces a navigable view rather than a
  // flat scroll-bomb.
  const grouped = new Map<DiffEntry["section"], DiffEntry[]>();
  for (const d of diffs) {
    const arr = grouped.get(d.section) ?? [];
    arr.push(d);
    grouped.set(d.section, arr);
  }

  return (
    <div className="space-y-6 p-4">
      <p className="text-sm text-muted-foreground">
        {diffs.length} change{diffs.length === 1 ? "" : "s"} across{" "}
        {grouped.size} section{grouped.size === 1 ? "" : "s"}. Original text on the
        left, tailored text on the right.
      </p>

      {[...grouped.entries()].map(([section, entries]) => (
        <section key={section} className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            {SECTION_LABEL[section]}
            {entries.length > 1 && (
              <span className="text-muted-foreground font-normal ml-2">
                ({entries.length} changes)
              </span>
            )}
          </h3>
          <div className="space-y-3">
            {entries.map((d, i) => (
              <div
                key={`${section}-${i}`}
                className="rounded-lg border bg-card overflow-hidden"
              >
                <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x">
                  <div className="p-3 bg-red-50 dark:bg-red-950/30">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-400 mb-1">
                      Original
                    </p>
                    <p className="text-sm whitespace-pre-wrap text-foreground/80 line-through decoration-red-400/60">
                      {d.original}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950/30">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-green-700 dark:text-green-400 mb-1">
                      Tailored
                    </p>
                    <p className="text-sm whitespace-pre-wrap text-foreground">
                      {d.tailored}
                    </p>
                  </div>
                </div>
                <div className="px-3 py-2 border-t bg-muted/30 flex items-start gap-2">
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    Why
                  </Badge>
                  <p className="text-xs text-muted-foreground">{d.changeReason}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
