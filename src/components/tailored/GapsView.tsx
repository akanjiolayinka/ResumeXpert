import { CheckCircle2, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type GapEntry = {
  skill: string;
  evidence: string;
};

type Props = {
  gaps: GapEntry[];
};

export function GapsView({ gaps }: Props) {
  if (gaps.length === 0) {
    return (
      <div className="p-6 flex items-start gap-3 rounded-lg bg-muted/30">
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">Your resume covers all key requirements</p>
          <p className="text-sm text-muted-foreground mt-1">
            Every skill or qualification the job description called out was already
            represented in your resume.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start gap-2">
        <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium">Skills to develop</p>
          <p className="text-xs text-muted-foreground mt-1">
            The job calls out these qualifications, but they aren&apos;t in your resume.
            We did not add them — your resume only reflects what you&apos;ve actually
            done. Consider learning or building experience in these areas, or
            adjusting your application strategy.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {gaps.map((g, i) => (
          <div
            key={`${g.skill}-${i}`}
            className="rounded-lg border bg-card p-3 space-y-2"
          >
            <div className="flex items-center gap-2">
              <Badge variant="outline">{g.skill}</Badge>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <span className="text-muted-foreground shrink-0">From the JD:</span>
              <blockquote className="italic text-foreground/80 border-l-2 border-muted pl-2">
                &ldquo;{g.evidence}&rdquo;
              </blockquote>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
