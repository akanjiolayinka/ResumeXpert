import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExportMenu } from "@/components/tailored/ExportMenu";
import type { ResumeStructuredData } from "@/lib/export/ResumeDocument";
import { useTailoringJobs, type TailoringJob } from "@/lib/queries/tailoringJobs";
import { useATSScores } from "@/lib/queries/atsScores";
import { useResumes } from "@/lib/queries/resumes";
import { useTailoredResumes } from "@/lib/queries/tailoredResumes";

type StatusKey = TailoringJob["status"];

const STATUS_STYLES: Record<StatusKey, string> = {
  pending: "bg-muted text-muted-foreground border-muted",
  running: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  succeeded: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
};

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

const PAGE_SIZE = 10;

export function TailoringHistoryTable() {
  const navigate = useNavigate();
  const { data: jobs, isLoading } = useTailoringJobs();
  const { data: scores } = useATSScores();
  const { data: resumes } = useResumes();
  const tailoredIds = useMemo(
    () => (jobs ?? []).map((j) => j.tailored_resume_id).filter((id): id is string => !!id),
    [jobs],
  );
  const { data: tailoredRows } = useTailoredResumes(tailoredIds);
  const [showAll, setShowAll] = useState(false);

  const scoreById = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of scores ?? []) {
      if (s.id) map.set(s.id, s.overall);
    }
    return map;
  }, [scores]);

  const resumeLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of resumes ?? []) map.set(r.id, r.label);
    return map;
  }, [resumes]);

  const structuredById = useMemo(() => {
    const map = new Map<string, ResumeStructuredData>();
    for (const t of tailoredRows ?? []) {
      if (t) map.set(t.id, t.structured as ResumeStructuredData);
    }
    return map;
  }, [tailoredRows]);

  if (isLoading) return null;

  const sorted = [...(jobs ?? [])];
  // useTailoringJobs already sorts desc by created_at, but be defensive.
  sorted.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No tailoring jobs yet — paste a job description to get started.
        </p>
      </div>
    );
  }

  const visible = showAll ? sorted : sorted.slice(0, PAGE_SIZE);
  const hasMore = sorted.length > PAGE_SIZE;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role &amp; Company</TableHead>
              <TableHead className="hidden sm:table-cell">Base Resume</TableHead>
              <TableHead className="text-center">ATS</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="text-right">Export</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((job) => {
              const score = job.ats_score_id ? scoreById.get(job.ats_score_id) : undefined;
              const baseLabel = resumeLabelById.get(job.base_resume_id) ?? "—";
              const structured = job.tailored_resume_id
                ? structuredById.get(job.tailored_resume_id)
                : undefined;

              return (
                <TableRow
                  key={job.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/resume-tailor?tailoring_job_id=${job.id}`)}
                >
                  <TableCell className="font-medium">
                    <div className="truncate">{job.role_title ?? "Untitled role"}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {job.company_name ?? "—"}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground truncate max-w-[180px]">
                    {baseLabel}
                  </TableCell>
                  <TableCell className="text-center">
                    {typeof score === "number" ? (
                      <span className="font-semibold">{score}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[job.status]}`}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {formatDate(job.created_at)}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    {structured ? (
                      <ExportMenu
                        structured={structured}
                        roleTitle={job.role_title}
                        companyName={job.company_name}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {hasMore && (
        <div className="p-3 border-t flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll((s) => !s)}
            className="text-sm text-primary hover:underline"
          >
            {showAll ? "Show 10 most recent" : `View all ${sorted.length}`}
          </button>
        </div>
      )}
    </div>
  );
}
