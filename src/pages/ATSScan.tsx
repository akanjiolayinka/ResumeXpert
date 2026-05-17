import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout, PageHeader } from "@/components/layout";
import { ScoreMeter } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Info, CheckCircle, RefreshCw, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveToLocalStorage, loadFromLocalStorage } from "@/lib/storage";
import { ResumeUploader } from "@/components/upload/ResumeUploader";
import { supabase } from "@/lib/supabase";
import {
  useScoreResume,
  type ATSScore,
  type ATSSubscores,
  type ATSSuggestion,
} from "@/lib/queries/atsScores";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "ats_scan_form";

const scanSchema = z.object({
  resumeText: z
    .string()
    .trim()
    .min(100, "Paste at least 100 characters of resume text, or upload a resume."),
  jobDescription: z.string().trim().optional(),
});
type ScanValues = z.infer<typeof scanSchema>;

export default function ATSScan() {
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [result, setResult] = useState<ATSScore | null>(null);
  const { toast } = useToast();
  const scoreResume = useScoreResume();

  const saved = loadFromLocalStorage<Partial<ScanValues>>(STORAGE_KEY, {});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ScanValues>({
    resolver: zodResolver(scanSchema),
    defaultValues: {
      resumeText: saved.resumeText ?? "",
      jobDescription: saved.jobDescription ?? "",
    },
  });

  const values = watch();
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEY, values);
  }, [values]);

  const onSubmit = async (data: ScanValues) => {
    try {
      // Resolve the input shape: either an existing resume_id (from an
      // upload) or a freshly-inserted manual resume row carrying the pasted
      // text. The edge function only accepts an id, so manual paste needs to
      // be persisted first.
      let id = resumeId;
      if (!id) {
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr || !userData.user) throw new Error("Not authenticated");
        const firstLine =
          data.resumeText
            .split(/\r?\n/)
            .map((l) => l.trim())
            .find((l) => l.length > 0) ?? "";
        const { data: created, error: cErr } = await supabase
          .from("resumes")
          .insert({
            user_id: userData.user.id,
            label: "Pasted resume",
            source_kind: "manual",
            raw_text: data.resumeText,
            structured: {
              rawTextOnly: true,
              fullName: firstLine.slice(0, 120),
            } as never,
          } as never)
          .select("id")
          .single();
        if (cErr || !created) {
          throw new Error(cErr?.message ?? "Failed to save resume");
        }
        id = created.id;
        setResumeId(id);
      }

      const scoreResult = await scoreResume.mutateAsync({
        resume_id: id,
        job_description: data.jobDescription || undefined,
      });
      setResult(scoreResult.ats_score);
    } catch (err) {
      toast({
        title: "Scoring failed",
        description: err instanceof Error ? err.message : "Could not score this resume. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRescoreReset = () => {
    setResult(null);
    setValue("jobDescription", "", { shouldValidate: false });
  };

  const handleResetAll = () => {
    setResult(null);
    setResumeId(null);
    reset({ resumeText: "", jobDescription: "" });
  };

  const isScanning = scoreResume.isPending;
  const failed = !isScanning && scoreResume.isError && !result;

  return (
    <Layout>
      <div className="page-container section-spacing">
        <PageHeader
          title="ATS Score & Fix Suggestions"
          description="Check how ATS-friendly your resume is and get prioritized suggestions to improve your match rate."
          helperText="This is a guidance score based on common ATS patterns, not a guarantee."
        />

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Input */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <ResumeUploader
              compact
              onUploaded={(resume) => {
                setValue("resumeText", resume.raw_text, { shouldValidate: true });
                setResumeId(resume.id);
                toast({
                  title: resume.parse_failed ? "Partial parse" : "Resume uploaded",
                  description: resume.parse_failed
                    ? "We extracted the text but couldn't structure all sections."
                    : "Your resume text is ready below.",
                });
              }}
            />

            <div>
              <Label htmlFor="resumeText">
                Resume Text <span aria-hidden="true">*</span>
              </Label>
              <Textarea
                id="resumeText"
                placeholder="Paste your resume here…"
                rows={12}
                className="mt-1.5 font-mono text-sm"
                {...register("resumeText", {
                  onChange: () => {
                    // Editing the text after an upload invalidates the link
                    // to the uploaded row; treat it as a fresh manual paste.
                    if (resumeId) setResumeId(null);
                  },
                })}
              />
              {errors.resumeText && (
                <p className="mt-1 text-xs text-destructive">{errors.resumeText.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="jobDescription">Job Description (optional)</Label>
              <Textarea
                id="jobDescription"
                placeholder="Paste the job description for keyword matching…"
                rows={6}
                className="mt-1.5"
                {...register("jobDescription")}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Adding a job description gives a more accurate score.
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isScanning} className="flex-1">
                {isScanning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analysing your resume…
                  </>
                ) : failed ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </>
                ) : result ? (
                  "Re-score"
                ) : (
                  "Scan Resume"
                )}
              </Button>
              {result && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRescoreReset}
                  title="Clear the current score and paste a different JD"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  New JD
                </Button>
              )}
            </div>
            {result && (
              <button
                type="button"
                onClick={handleResetAll}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                Start over with a different resume
              </button>
            )}
          </form>

          {/* Right: Results */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ResultsPanel isScanning={isScanning} result={result} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

// ── Results panel ─────────────────────────────────────────────────────────

function ResultsPanel({
  isScanning,
  result,
}: {
  isScanning: boolean;
  result: ATSScore | null;
}) {
  if (isScanning) {
    return (
      <div className="bg-card border rounded-xl p-8 text-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Analysing your resume…</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground">
        <p>Paste your resume and click &ldquo;Scan Resume&rdquo; to see your ATS score and improvement suggestions.</p>
      </div>
    );
  }

  const subscores = result.subscores as unknown as ATSSubscores;
  const suggestions = (result.suggestions as unknown as ATSSuggestion[]) ?? [];

  return (
    <div className="bg-card border rounded-xl p-6 space-y-6">
      {/* Score */}
      <div className="text-center">
        <h3 className="font-semibold text-lg mb-4">Your ATS Score</h3>
        <ScoreMeter score={result.overall} size="lg" />
      </div>

      {/* Subscores */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Keyword Match", score: subscores.keyword },
          { label: "Structure", score: subscores.structure },
          { label: "Formatting", score: subscores.formatting },
          { label: "Impact", score: subscores.impact },
        ].map((item) => (
          <div key={item.label} className="p-3 bg-muted/50 rounded-lg text-center">
            <div className={cn("text-2xl font-bold", subscoreColor(item.score))}>
              {item.score}
            </div>
            <div className="text-xs text-muted-foreground">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Suggestions */}
      <div>
        <h4 className="font-semibold mb-3">Priority Suggestions</h4>
        <div className="space-y-2">
          {suggestions.map((s, i) => (
            <div
              key={`${s.priority}-${i}`}
              className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
            >
              <PriorityIcon priority={s.priority} />
              <div className="flex-1 space-y-1">
                <p className="text-sm">{s.text}</p>
                {s.anchor && (
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-mono">
                    {s.anchor}
                  </p>
                )}
              </div>
              <PriorityBadge priority={s.priority} />
            </div>
          ))}
        </div>
      </div>

      {/* Matched + Missing keywords */}
      {(result.matched_keywords.length > 0 || result.missing_keywords.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {result.matched_keywords.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-sm">
                Matched ({result.matched_keywords.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {result.matched_keywords.map((kw) => (
                  <Badge
                    key={`m-${kw}`}
                    variant="outline"
                    className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30"
                  >
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {result.missing_keywords.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-sm">
                Missing ({result.missing_keywords.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {result.missing_keywords.map((kw) => (
                  <Badge
                    key={`x-${kw}`}
                    variant="outline"
                    className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30"
                  >
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center pt-2 border-t">
        This is a guidance score based on common ATS patterns, not a guarantee of success.
      </p>
    </div>
  );
}

function subscoreColor(score: number): string {
  if (score >= 70) return "text-green-600 dark:text-green-400";
  if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function PriorityIcon({ priority }: { priority: ATSSuggestion["priority"] }) {
  if (priority === "high") return <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />;
  if (priority === "medium") return <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />;
  return <CheckCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />;
}

function PriorityBadge({ priority }: { priority: ATSSuggestion["priority"] }) {
  const styles: Record<ATSSuggestion["priority"], string> = {
    high: "bg-destructive/10 text-destructive border-destructive/20",
    medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    low: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  };
  return (
    <Badge variant="outline" className={cn("text-[10px] shrink-0", styles[priority])}>
      {priority.toUpperCase()}
    </Badge>
  );
}
