import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout, PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Plus, Trash2, RotateCcw, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveToLocalStorage, loadFromLocalStorage } from "@/lib/storage";
import { CoverLetterEditor } from "@/components/cover/CoverLetterEditor";
import {
  useGenerateCoverLetter,
  useLatestCoverLetter,
  type CoverLetter,
} from "@/lib/queries/coverLetters";
import { useTailoringJobs } from "@/lib/queries/tailoringJobs";

const STORAGE_KEY = "cover_letter_form";

const proofPointSchema = z.object({
  text: z
    .string()
    .trim()
    .min(10, "Each proof point should be at least 10 characters")
    .or(z.literal("")),
});

const coverFormSchema = z.object({
  jobDescription: z.string().trim().min(50, "Paste at least 50 characters of job description."),
  companyName: z.string().trim().min(1, "Company name is required"),
  roleTitle: z.string().trim().min(1, "Role title is required"),
  tone: z.enum(["warm", "direct", "enthusiastic"]),
  proofPoints: z.array(proofPointSchema).max(4),
});

type CoverFormValues = z.infer<typeof coverFormSchema>;

const TONE_DESCRIPTIONS: Record<CoverFormValues["tone"], string> = {
  warm: "Friendly and personable",
  direct: "Concise and to-the-point",
  enthusiastic: "Energetic and passionate",
};

export default function CoverLetter() {
  const { toast } = useToast();
  const generateMut = useGenerateCoverLetter();
  const { data: latestLetter } = useLatestCoverLetter();
  const { data: jobs } = useTailoringJobs();

  const [result, setResult] = useState<CoverLetter | null>(null);
  // Only pre-fill from the user's latest cover letter on the FIRST load.
  // Otherwise "Start over" → setResult(null) would immediately re-show the
  // just-generated letter, defeating the start-over.
  const didInitialFill = useRef(false);
  useEffect(() => {
    if (didInitialFill.current) return;
    if (latestLetter) {
      didInitialFill.current = true;
      setResult(latestLetter);
    }
  }, [latestLetter]);

  const latestSucceededJob = useMemo(
    () => jobs?.find((j) => j.status === "succeeded") ?? null,
    [jobs],
  );

  const saved = loadFromLocalStorage<Partial<CoverFormValues>>(STORAGE_KEY, {});

  const defaultValues: CoverFormValues = {
    jobDescription: saved.jobDescription ?? "",
    companyName: saved.companyName ?? latestSucceededJob?.company_name ?? "",
    roleTitle: saved.roleTitle ?? latestSucceededJob?.role_title ?? "",
    tone: saved.tone ?? "warm",
    proofPoints: saved.proofPoints?.length ? saved.proofPoints : [{ text: "" }],
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CoverFormValues>({
    resolver: zodResolver(coverFormSchema),
    defaultValues,
  });

  // Auto-populate company/role from the latest succeeded job once it loads,
  // but only if those fields are still empty (don't clobber user typing).
  useEffect(() => {
    if (!latestSucceededJob) return;
    const current = watch();
    if (!current.companyName && latestSucceededJob.company_name) {
      setValue("companyName", latestSucceededJob.company_name);
    }
    if (!current.roleTitle && latestSucceededJob.role_title) {
      setValue("roleTitle", latestSucceededJob.role_title);
    }
  }, [latestSucceededJob, setValue, watch]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "proofPoints",
  });

  const formValues = watch();
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEY, formValues);
  }, [formValues]);

  const onSubmit = async (data: CoverFormValues) => {
    const proofs = data.proofPoints
      .map((p) => p.text.trim())
      .filter((p) => p.length >= 10);

    try {
      const { cover_letter } = await generateMut.mutateAsync({
        tailoring_job_id: latestSucceededJob?.id,
        // If there's no tailoring job but the user has uploaded resumes, the
        // edge function still needs a source. We pass base_resume_id as a
        // fallback when we have a succeeded job (its base_resume_id is the
        // same shape). Without either, the edge function will 400 — covered
        // by the "missing_source" path.
        base_resume_id: latestSucceededJob?.base_resume_id,
        role_title: data.roleTitle,
        company_name: data.companyName,
        job_description: data.jobDescription,
        tone: data.tone,
        proof_points: proofs.length ? proofs : undefined,
      });
      setResult(cover_letter);
    } catch (err) {
      toast({
        title: "Generation failed",
        description: err instanceof Error ? err.message : "Could not generate cover letter.",
        variant: "destructive",
      });
    }
  };

  const handleStartOver = () => {
    setResult(null);
    reset({
      jobDescription: "",
      companyName: "",
      roleTitle: "",
      tone: "warm",
      proofPoints: [{ text: "" }],
    });
  };

  const handleRegenerate = () => {
    // Re-run the same form values. The edge function inserts a NEW cover_letter
    // row (we don't mutate the existing one), so the user effectively gets a
    // fresh attempt while the old row stays in their history.
    void handleSubmit(onSubmit)();
  };

  const isGenerating = generateMut.isPending;
  const showForm = !result;

  return (
    <Layout>
      <div className="page-container section-spacing">
        <PageHeader
          title="Cover Letter Generator"
          description="Create a tailored cover letter that highlights real achievements from your resume."
          helperText={
            latestSucceededJob
              ? `Using your latest tailored resume for ${latestSucceededJob.company_name ?? "this role"} as the source.`
              : "Run a tailor first to get the best results — we'll auto-populate company and role from it."
          }
        />

        {showForm ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              <div>
                <Label htmlFor="jobDescription">
                  Job Description <span aria-hidden="true">*</span>
                </Label>
                <Textarea
                  id="jobDescription"
                  placeholder="Paste the job description here…"
                  rows={6}
                  className="mt-1.5"
                  {...register("jobDescription")}
                />
                {errors.jobDescription && (
                  <p className="mt-1 text-xs text-destructive">{errors.jobDescription.message}</p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">
                    Company Name <span aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="e.g. Flutterwave"
                    className="mt-1.5"
                    {...register("companyName")}
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-xs text-destructive">{errors.companyName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="roleTitle">
                    Role Title <span aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id="roleTitle"
                    placeholder="e.g. Software Engineer"
                    className="mt-1.5"
                    {...register("roleTitle")}
                  />
                  {errors.roleTitle && (
                    <p className="mt-1 text-xs text-destructive">{errors.roleTitle.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Proof Points (optional)</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Add up to 4 specific achievements you want highlighted. If you leave this blank,
                  we&apos;ll pull the most relevant ones straight from your resume.
                </p>
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="space-y-1">
                      <div className="flex gap-2">
                        <Input
                          placeholder={`Achievement ${index + 1}…`}
                          {...register(`proofPoints.${index}.text` as const)}
                        />
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="shrink-0 text-destructive hover:text-destructive"
                            aria-label="Remove proof point"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {errors.proofPoints?.[index]?.text && (
                        <p className="text-xs text-destructive">
                          {errors.proofPoints[index]?.text?.message}
                        </p>
                      )}
                    </div>
                  ))}
                  {fields.length < 4 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ text: "" })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add proof point
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-muted/20">
                <Label className="mb-3 block">Tone</Label>
                <RadioGroup
                  value={watch("tone")}
                  onValueChange={(value) =>
                    setValue("tone", value as CoverFormValues["tone"], { shouldDirty: true })
                  }
                  className="flex flex-col gap-3"
                >
                  {(["warm", "direct", "enthusiastic"] as const).map((tone) => (
                    <div key={tone} className="flex items-center space-x-2">
                      <RadioGroupItem value={tone} id={`tone-${tone}`} />
                      <Label htmlFor={`tone-${tone}`} className="cursor-pointer">
                        <span className="font-medium capitalize">{tone}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {TONE_DESCRIPTIONS[tone]}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Button type="submit" disabled={isGenerating} className="w-full">
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Writing your cover letter…
                  </>
                ) : generateMut.isError ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </>
                ) : (
                  "Generate Cover Letter"
                )}
              </Button>
            </form>

            {/* Right: placeholder until first generation */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground">
                {isGenerating ? (
                  <>
                    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p>Writing your cover letter…</p>
                  </>
                ) : (
                  <p>
                    Fill in the details and click &ldquo;Generate Cover Letter&rdquo; to create
                    a tailored letter you can edit in place.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleStartOver} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Start over
              </Button>
            </div>
            <CoverLetterEditor
              coverLetter={result}
              onRegenerate={handleRegenerate}
              isRegenerating={isGenerating}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
