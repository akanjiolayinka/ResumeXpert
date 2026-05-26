import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layout, PageHeader } from "@/components/layout";
import { OutputPanel } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveToLocalStorage, loadFromLocalStorage } from "@/lib/storage";
import { ResumeUploader } from "@/components/upload/ResumeUploader";
import { tailorRequestSchema, type TailorRequestValues } from "@/lib/schemas/tailor";
import { useCreateTailoringJob } from "@/lib/queries/tailoringJobs";
import { useTailoringJob } from "@/lib/realtime/useTailoringJob";
import { useTailoredResume } from "@/lib/queries/tailoringJobs";
import { DiffView, type DiffEntry } from "@/components/tailored/DiffView";
import { GapsView, type GapEntry } from "@/components/tailored/GapsView";
import { ExportMenu } from "@/components/tailored/ExportMenu";
import type { ResumeStructuredData } from "@/lib/export/ResumeDocument";

const STORAGE_KEY = "resume_tailor_form";

const STATUS_TEXT: Record<string, string> = {
  pending: "Preparing your resume…",
  running: "Tailoring with AI — this takes 5–10 seconds…",
};

export default function ResumeTailor() {
  // baseResumeId is set when a file is uploaded; null means paste-only (auto-row)
  const [baseResumeId, setBaseResumeId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const { toast } = useToast();
  const createJob = useCreateTailoringJob();
  const { job } = useTailoringJob(jobId);
  const { data: tailoredResume } = useTailoredResume(job?.tailored_resume_id ?? null);

  const savedForm = loadFromLocalStorage<Partial<TailorRequestValues>>(STORAGE_KEY, {});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TailorRequestValues>({
    resolver: zodResolver(tailorRequestSchema),
    defaultValues: {
      resumeText: savedForm.resumeText ?? "",
      jobDescription: savedForm.jobDescription ?? "",
      roleTitle: savedForm.roleTitle ?? "",
      companyName: savedForm.companyName ?? "",
    },
  });

  // Persist form to localStorage on change
  const formValues = watch();
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEY, formValues);
  }, [formValues]);

  // Surface failed status as a toast (once per jobId)
  useEffect(() => {
    if (job?.status === "failed") {
      toast({
        title: "Tailoring failed",
        description: job.error_message ?? "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  }, [job?.status, job?.error_message, toast]);

  const onSubmit = async (values: TailorRequestValues) => {
    // Reset previous result so the panel shows the loading state
    setJobId(null);
    try {
      const result = await createJob.mutateAsync({
        baseResumeId,
        resumeText: values.resumeText,
        jobDescription: values.jobDescription,
        roleTitle: values.roleTitle || undefined,
        companyName: values.companyName || undefined,
      });
      setJobId(result.jobId);
    } catch (err) {
      toast({
        title: "Request failed",
        description: err instanceof Error ? err.message : "Could not start tailoring. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isInFlight =
    createJob.isPending ||
    (job !== null && job !== undefined && job.status === "pending") ||
    (job !== null && job !== undefined && job.status === "running");

  const succeeded = job?.status === "succeeded" && tailoredResume !== null && tailoredResume !== undefined;
  const failed = job?.status === "failed";

  // Derive loader label
  let statusLabel = "Generating your tailored resume…";
  if (createJob.isPending) statusLabel = "Submitting…";
  else if (job?.status) statusLabel = STATUS_TEXT[job.status] ?? statusLabel;

  // Parse structured diffs + gaps from tailored_resumes.structured (jsonb)
  let diffs: DiffEntry[] = [];
  let gaps: GapEntry[] = [];
  if (tailoredResume?.structured) {
    const s = tailoredResume.structured as Record<string, unknown>;
    if (Array.isArray(s.diffs)) diffs = s.diffs as DiffEntry[];
    if (Array.isArray(s.gaps)) gaps = s.gaps as GapEntry[];
  }

  const outputTabs = succeeded
    ? [
        {
          id: "tailored",
          label: "Tailored Resume",
          content: tailoredResume!.rendered_text,
        },
        {
          id: "changes",
          label: "What Changed",
          content: <DiffView diffs={diffs} />,
        },
        {
          id: "gaps",
          label: "Skill Gaps",
          content: <GapsView gaps={gaps} />,
        },
      ]
    : [
        {
          id: "tailored",
          label: "Tailored Resume",
          content: 'Paste your resume and job description, then click "Generate Tailored Resume" to see the result.',
        },
      ];

  return (
    <Layout>
      <div className="page-container section-spacing">
        <PageHeader
          title="Tailor Resume to Job"
          description="Optimize your existing resume to match a specific job description using AI. We'll highlight what changed and flag skill gaps."
        />

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <ResumeUploader
              onUploaded={(resume) => {
                setValue("resumeText", resume.raw_text, { shouldValidate: true });
                setBaseResumeId(resume.id);
                toast({
                  title: resume.parse_failed ? "Partial parse" : "Resume uploaded",
                  description: resume.parse_failed
                    ? "We extracted the text but couldn't fully structure it. Edit below as needed."
                    : "Your resume text is ready below.",
                });
              }}
            />

            {/* Resume Text */}
            <div>
              <Label htmlFor="resumeText">
                Or paste your resume text <span aria-hidden="true">*</span>
              </Label>
              <Textarea
                id="resumeText"
                placeholder="Paste your current resume here…"
                rows={10}
                className="mt-1.5 font-mono text-sm"
                {...register("resumeText")}
              />
              {errors.resumeText && (
                <p className="mt-1 text-xs text-destructive">{errors.resumeText.message}</p>
              )}
            </div>

            {/* Job Description */}
            <div>
              <Label htmlFor="jobDescription">
                Job Description <span aria-hidden="true">*</span>
              </Label>
              <Textarea
                id="jobDescription"
                placeholder="Paste the job description here…"
                rows={8}
                className="mt-1.5"
                {...register("jobDescription")}
              />
              {errors.jobDescription && (
                <p className="mt-1 text-xs text-destructive">{errors.jobDescription.message}</p>
              )}
            </div>

            {/* Optional fields */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="roleTitle">Role Title (optional)</Label>
                <Input
                  id="roleTitle"
                  placeholder="e.g. Senior Software Engineer"
                  className="mt-1.5"
                  {...register("roleTitle")}
                />
              </div>
              <div>
                <Label htmlFor="companyName">Company Name (optional)</Label>
                <Input
                  id="companyName"
                  placeholder="e.g. Flutterwave"
                  className="mt-1.5"
                  {...register("companyName")}
                />
              </div>
            </div>

            <Button type="submit" disabled={isInFlight} className="w-full">
              {isInFlight ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {statusLabel}
                </>
              ) : failed ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </>
              ) : (
                "Generate Tailored Resume"
              )}
            </Button>
          </form>

          {/* Right: Output */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-3">
            {succeeded && tailoredResume && (
              <div className="flex justify-end">
                <ExportMenu
                  structured={tailoredResume.structured as ResumeStructuredData}
                  roleTitle={job?.role_title}
                  companyName={job?.company_name}
                />
              </div>
            )}
            <OutputPanel
              title="Tailored Resume"
              tabs={outputTabs}
              isLoading={isInFlight}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
