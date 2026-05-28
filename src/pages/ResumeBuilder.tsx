import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layout, PageHeader } from "@/components/layout";
import { OutputPanel } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Loader2,
  Save,
  Check,
  Wand2,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveToLocalStorage, loadFromLocalStorage } from "@/lib/storage";
import {
  resumeFormSchema,
  emptyResumeForm,
  type ResumeFormValues,
} from "@/lib/schemas/resume";
import { sampleProfiles } from "@/lib/sample-profiles";
import {
  resumeFormToStructured,
  resumeFormToRawText,
} from "@/lib/export/resumeFormToRawText";
import { supabase } from "@/lib/supabase";
import { useCreateResume } from "@/lib/queries/resumes";
import { useCreateTailoringJob, useTailoredResume } from "@/lib/queries/tailoringJobs";
import { useTailoringJob } from "@/lib/realtime/useTailoringJob";
import { DiffView, type DiffEntry } from "@/components/tailored/DiffView";
import { GapsView, type GapEntry } from "@/components/tailored/GapsView";
import { ExportMenu } from "@/components/tailored/ExportMenu";
import type { ResumeStructuredData } from "@/lib/export/ResumeDocument";

const STORAGE_KEY = "resume_builder_form";

const STATUS_TEXT: Record<string, string> = {
  pending: "Preparing your resume…",
  running: "Tailoring with AI — this takes 5–10 seconds…",
};

export default function ResumeBuilder() {
  const { toast } = useToast();
  const createResume = useCreateResume();
  const createJob = useCreateTailoringJob();

  const [savedResumeId, setSavedResumeId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const { job } = useTailoringJob(jobId);
  const { data: tailoredResume } = useTailoredResume(job?.tailored_resume_id ?? null);

  const saved = loadFromLocalStorage<ResumeFormValues>(STORAGE_KEY, emptyResumeForm);

  const form = useForm<ResumeFormValues>({
    resolver: zodResolver(resumeFormSchema),
    defaultValues: { ...emptyResumeForm, ...saved },
  });
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = form;

  const experiences = useFieldArray({ control, name: "experiences" });
  const projects = useFieldArray({ control, name: "projects" });
  const education = useFieldArray({ control, name: "education" });

  const formValues = watch();
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEY, formValues);
  }, [formValues]);

  // Surface a failed tailoring job as a toast.
  useEffect(() => {
    if (job?.status === "failed") {
      toast({
        title: "Tailoring failed",
        description: job.error_message ?? "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  }, [job?.status, job?.error_message, toast]);

  const jdValue = watch("jobDescription");
  const canTailor = !!jdValue && jdValue.trim().length > 0;
  const isSaved = !!savedResumeId && !isDirty;

  const isTailoring =
    createJob.isPending ||
    job?.status === "pending" ||
    job?.status === "running";

  const succeeded =
    job?.status === "succeeded" && tailoredResume !== null && tailoredResume !== undefined;

  let statusLabel = "Tailoring…";
  if (createJob.isPending) statusLabel = "Saving & submitting…";
  else if (job?.status) statusLabel = STATUS_TEXT[job.status] ?? statusLabel;

  // ── Persistence helpers ─────────────────────────────────────────────
  const persist = async (data: ResumeFormValues): Promise<string> => {
    const structured = resumeFormToStructured(data);
    const raw_text = resumeFormToRawText(data);
    const label = data.fullName ? `${data.fullName}'s resume` : "My resume";

    if (savedResumeId) {
      const { error } = await supabase
        .from("resumes")
        .update({ label, raw_text, structured: structured as never } as never)
        .eq("id", savedResumeId);
      if (error) throw new Error(error.message);
      reset(data);
      return savedResumeId;
    }

    const created = await createResume.mutateAsync({
      label,
      raw_text,
      structured,
      source_kind: "manual",
    });
    setSavedResumeId(created.id);
    reset(data);
    return created.id;
  };

  const onSave = handleSubmit(async (data) => {
    try {
      await persist(data);
      toast({ title: "Saved", description: "Your resume is saved to your dashboard." });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Could not save your resume.",
        variant: "destructive",
      });
    }
  });

  const onTailor = handleSubmit(async (data) => {
    if (!data.jobDescription || data.jobDescription.trim().length === 0) return;
    try {
      // Save first if there's no saved resume yet or the form changed since.
      const baseResumeId = !savedResumeId || isDirty ? await persist(data) : savedResumeId;
      setJobId(null);
      const { jobId: newJobId } = await createJob.mutateAsync({
        baseResumeId,
        resumeText: resumeFormToRawText(data),
        jobDescription: data.jobDescription,
        roleTitle: data.roleTitle || undefined,
        companyName: data.companyName || undefined,
      });
      setJobId(newJobId);
    } catch (err) {
      toast({
        title: "Tailoring request failed",
        description: err instanceof Error ? err.message : "Could not start tailoring.",
        variant: "destructive",
      });
    }
  });

  const onClear = () => {
    reset(emptyResumeForm);
    setSavedResumeId(null);
    setJobId(null);
  };

  const onSample = (key: string) => {
    const profile = sampleProfiles[key];
    if (!profile) return;
    reset(profile.data);
    setSavedResumeId(null);
    setJobId(null);
  };

  // ── Output panel content ────────────────────────────────────────────
  let diffs: DiffEntry[] = [];
  let gaps: GapEntry[] = [];
  if (tailoredResume?.structured) {
    const s = tailoredResume.structured as Record<string, unknown>;
    if (Array.isArray(s.diffs)) diffs = s.diffs as DiffEntry[];
    if (Array.isArray(s.gaps)) gaps = s.gaps as GapEntry[];
  }

  const previewText = resumeFormToRawText(formValues);

  const outputTabs = succeeded
    ? [
        { id: "tailored", label: "Tailored Resume", content: tailoredResume!.rendered_text },
        { id: "changes", label: "What Changed", content: <DiffView diffs={diffs} /> },
        { id: "gaps", label: "Skill Gaps", content: <GapsView gaps={gaps} /> },
      ]
    : savedResumeId
      ? [{ id: "preview", label: "Preview", content: previewText }]
      : [
          {
            id: "preview",
            label: "Preview",
            content: 'Fill in your details and click "Save Resume" to store it on your dashboard.',
          },
        ];

  return (
    <Layout>
      <div className="page-container section-spacing">
        <PageHeader
          title="Resume Builder"
          description="Build a resume from scratch, save it to your dashboard, and optionally tailor it to a specific job."
        />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Select onValueChange={onSample}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Use a sample" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(sampleProfiles).map(([key, p]) => (
                <SelectItem key={key} value={key}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={onClear} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Clear Form
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <form onSubmit={onSave} className="space-y-6" noValidate>
            {/* Personal info */}
            <Card className="p-4 space-y-4">
              <h3 className="font-semibold">Personal Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input id="fullName" className="mt-1.5" {...register("fullName")} />
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-destructive">{errors.fullName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" className="mt-1.5" {...register("email")} />
                  {errors.email && (
                    <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" className="mt-1.5" {...register("phone")} />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" className="mt-1.5" {...register("location")} />
                </div>
                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input id="linkedin" className="mt-1.5" {...register("linkedin")} />
                </div>
                <div>
                  <Label htmlFor="portfolio">Portfolio</Label>
                  <Input id="portfolio" className="mt-1.5" {...register("portfolio")} />
                </div>
              </div>
            </Card>

            {/* Summary */}
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold">Professional Summary</h3>
              <Textarea rows={4} placeholder="A short summary of who you are…" {...register("summary")} />
            </Card>

            {/* Skills */}
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold">Skills</h3>
              <Input placeholder="Comma-separated, e.g. React, Node.js, SQL" {...register("skills")} />
              <p className="text-xs text-muted-foreground">Separate skills with commas.</p>
            </Card>

            {/* Experience */}
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Experience</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    experiences.append({ company: "", role: "", dates: "", bullets: "", metrics: "" })
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {experiences.fields.map((field, i) => (
                <div key={field.id} className="space-y-2 border rounded-lg p-3">
                  <div className="grid sm:grid-cols-3 gap-2">
                    <div>
                      <Input placeholder="Role *" {...register(`experiences.${i}.role`)} />
                      {errors.experiences?.[i]?.role && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors.experiences[i]?.role?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Input placeholder="Company *" {...register(`experiences.${i}.company`)} />
                      {errors.experiences?.[i]?.company && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors.experiences[i]?.company?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Input placeholder="Dates * (e.g. Jun 2023 - Present)" {...register(`experiences.${i}.dates`)} />
                      {errors.experiences?.[i]?.dates && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors.experiences[i]?.dates?.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <Textarea
                    rows={3}
                    placeholder="Bullet points — one per line"
                    {...register(`experiences.${i}.bullets`)}
                  />
                  <Input placeholder="Metrics (optional, comma or line separated)" {...register(`experiences.${i}.metrics`)} />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => experiences.remove(i)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              {experiences.fields.length === 0 && (
                <p className="text-xs text-muted-foreground">No experience added yet.</p>
              )}
            </Card>

            {/* Projects */}
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Projects</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    projects.append({ name: "", link: "", stack: "", bullets: "", results: "" })
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {projects.fields.map((field, i) => (
                <div key={field.id} className="space-y-2 border rounded-lg p-3">
                  <div className="grid sm:grid-cols-3 gap-2">
                    <div>
                      <Input placeholder="Project name *" {...register(`projects.${i}.name`)} />
                      {errors.projects?.[i]?.name && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors.projects[i]?.name?.message}
                        </p>
                      )}
                    </div>
                    <Input placeholder="Stack" {...register(`projects.${i}.stack`)} />
                    <Input placeholder="Link" {...register(`projects.${i}.link`)} />
                  </div>
                  <Textarea
                    rows={2}
                    placeholder="Bullet points — one per line"
                    {...register(`projects.${i}.bullets`)}
                  />
                  <Input placeholder="Results (optional)" {...register(`projects.${i}.results`)} />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => projects.remove(i)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              {projects.fields.length === 0 && (
                <p className="text-xs text-muted-foreground">No projects added yet.</p>
              )}
            </Card>

            {/* Education */}
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Education</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => education.append({ school: "", degree: "", dates: "", gpa: "" })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {education.fields.map((field, i) => (
                <div key={field.id} className="space-y-2 border rounded-lg p-3">
                  <div className="grid sm:grid-cols-2 gap-2">
                    <div>
                      <Input placeholder="School *" {...register(`education.${i}.school`)} />
                      {errors.education?.[i]?.school && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors.education[i]?.school?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Input placeholder="Degree *" {...register(`education.${i}.degree`)} />
                      {errors.education?.[i]?.degree && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors.education[i]?.degree?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Input placeholder="Dates *" {...register(`education.${i}.dates`)} />
                      {errors.education?.[i]?.dates && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors.education[i]?.dates?.message}
                        </p>
                      )}
                    </div>
                    <Input placeholder="GPA / Class (optional)" {...register(`education.${i}.gpa`)} />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => education.remove(i)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              {education.fields.length === 0 && (
                <p className="text-xs text-muted-foreground">No education added yet.</p>
              )}
            </Card>

            {/* Extras */}
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold">Additional Sections</h3>
              <div>
                <Label htmlFor="certifications">Certifications</Label>
                <Textarea id="certifications" rows={2} placeholder="One per line" className="mt-1.5" {...register("certifications")} />
              </div>
              <div>
                <Label htmlFor="awards">Awards</Label>
                <Textarea id="awards" rows={2} placeholder="One per line" className="mt-1.5" {...register("awards")} />
              </div>
              <div>
                <Label htmlFor="volunteering">Volunteering</Label>
                <Textarea id="volunteering" rows={2} placeholder="One per line" className="mt-1.5" {...register("volunteering")} />
              </div>
            </Card>

            {/* Tailoring */}
            <Card className="p-4 space-y-4">
              <h3 className="font-semibold">Tailor to a Job (optional)</h3>
              <div>
                <Label htmlFor="jobDescription">Job Description</Label>
                <Textarea
                  id="jobDescription"
                  rows={5}
                  placeholder="Paste a job description here…"
                  className="mt-1.5"
                  {...register("jobDescription")}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Optional — paste a job description to tailor this resume to a specific role after saving.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="roleTitle">Role Title</Label>
                  <Input id="roleTitle" className="mt-1.5" {...register("roleTitle")} />
                </div>
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" className="mt-1.5" {...register("companyName")} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="onePageOnly">Keep it to one page</Label>
                <Switch
                  id="onePageOnly"
                  checked={watch("onePageOnly")}
                  onCheckedChange={(v) => form.setValue("onePageOnly", v, { shouldDirty: true })}
                />
              </div>
            </Card>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={createResume.isPending} className="gap-2">
                {createResume.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Resume
                  </>
                )}
              </Button>

              {isSaved && (
                <Badge variant="outline" className="gap-1 text-green-700 dark:text-green-400 border-green-500/30">
                  <Check className="h-3.5 w-3.5" />
                  Saved
                </Badge>
              )}

              <Button
                type="button"
                variant="secondary"
                onClick={onTailor}
                disabled={!canTailor || isTailoring}
                className="gap-2"
                title={canTailor ? undefined : "Add a job description to enable tailoring"}
              >
                {isTailoring ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {statusLabel}
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Tailor to this JD
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Right: Output */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-3">
            {succeeded && tailoredResume && (
              <div className="flex justify-end">
                <ExportMenu
                  structured={tailoredResume.structured as ResumeStructuredData}
                  roleTitle={watch("roleTitle")}
                  companyName={watch("companyName")}
                />
              </div>
            )}
            <OutputPanel
              title={succeeded ? "Tailored Resume" : "Resume Preview"}
              tabs={outputTabs}
              isLoading={isTailoring}
            />
            {savedResumeId && !succeeded && !canTailor && (
              <p className="text-xs text-muted-foreground text-center">
                Saved. Paste a job description above and click &ldquo;Tailor to this JD&rdquo; to optimize it for a role.
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
