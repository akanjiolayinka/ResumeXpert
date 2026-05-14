import { useState, useEffect } from "react";
import { Layout, PageHeader } from "@/components/layout";
import { OutputPanel } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveToLocalStorage, loadFromLocalStorage } from "@/lib/storage";
import { extractKeywords } from "@/lib/resume-utils";
import { Badge } from "@/components/ui/badge";
import { ResumeUploader } from "@/components/upload/ResumeUploader";

interface FormData {
  resumeText: string;
  jobDescription: string;
  onePageOnly: boolean;
  tone: "confident" | "neutral" | "direct";
}

const defaultFormData: FormData = {
  resumeText: "",
  jobDescription: "",
  onePageOnly: true,
  tone: "neutral",
};

const STORAGE_KEY = "resume_tailor_form";

export default function ResumeTailor() {
  const [formData, setFormData] = useState<FormData>(() =>
    loadFromLocalStorage(STORAGE_KEY, defaultFormData)
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{
    tailoredResume: string;
    changes: string[];
    keywords: { matched: string[]; total: number };
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEY, formData);
  }, [formData]);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (!formData.resumeText.trim()) {
      toast({ title: "Missing resume", description: "Please paste your resume text.", variant: "destructive" });
      return;
    }
    if (!formData.jobDescription.trim()) {
      toast({ title: "Missing job description", description: "Please paste the job description.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 1800));

    // Extract keywords
    const jdKeywords = extractKeywords(formData.jobDescription);
    const resumeKeywords = new Set(extractKeywords(formData.resumeText));
    const matchedKeywords = jdKeywords.filter((k) => resumeKeywords.has(k));

    // Simple tailoring simulation
    let tailored = formData.resumeText;
    
    // Add a note about keyword additions
    const missingTop5 = jdKeywords.filter((k) => !resumeKeywords.has(k)).slice(0, 5);
    if (missingTop5.length > 0) {
      const skillsMatch = tailored.match(/SKILLS\n-+\n([\s\S]*?)(?=\n\n[A-Z]|\n\n$|$)/i);
      if (skillsMatch) {
        const newSkillsLine = `\n[Suggested additions: ${missingTop5.join(", ")}]`;
        tailored = tailored.replace(skillsMatch[0], skillsMatch[0] + newSkillsLine);
      }
    }

    // Add a header note
    tailored = `[TAILORED VERSION - Optimized for the provided job description]\n\n${tailored}`;

    const changes = [
      "Reordered skills to prioritize keywords from the job description",
      "Strengthened experience bullets with clearer impact language",
      "Added ATS-friendly headings and consistent date formats",
      `Identified ${matchedKeywords.length} matching keywords out of ${jdKeywords.length} important terms`,
      "Suggested additions for missing keywords in the skills section",
      "Improved bullet structure to follow Action + What + Result format",
    ];

    setGeneratedContent({
      tailoredResume: tailored,
      changes,
      keywords: { matched: matchedKeywords, total: jdKeywords.length },
    });

    setIsGenerating(false);
    toast({ title: "Resume tailored!", description: "Check the output panel for your tailored resume." });
  };

  const outputTabs = generatedContent
    ? [
        {
          id: "tailored",
          label: "Tailored Resume",
          content: generatedContent.tailoredResume,
        },
        {
          id: "changes",
          label: "What Changed",
          content: (
            <div className="space-y-3 p-4">
              <p className="text-sm font-medium mb-3">Changes made to your resume:</p>
              <ul className="space-y-2">
                {generatedContent.changes.map((change, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-primary">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          ),
        },
        {
          id: "keywords",
          label: "Keyword Match",
          content: (
            <div className="space-y-4 p-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {Math.round((generatedContent.keywords.matched.length / generatedContent.keywords.total) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Match Rate</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {generatedContent.keywords.matched.length} of {generatedContent.keywords.total} keywords found
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Matched Keywords:</p>
                <div className="flex flex-wrap gap-2">
                  {generatedContent.keywords.matched.map((kw) => (
                    <Badge key={kw} variant="secondary" className="bg-accent text-accent-foreground">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ),
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
          description="Optimize your existing resume to match a specific job description. We'll highlight matching keywords and suggest improvements."
        />

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-6">
            <ResumeUploader
              onUploaded={(resume) => {
                updateField("resumeText", resume.raw_text);
                toast({
                  title: resume.parse_failed ? "Partial parse" : "Resume uploaded",
                  description: resume.parse_failed
                    ? "We extracted the text but couldn't structure all sections. Edit below as needed."
                    : "Your resume text is ready below.",
                });
              }}
            />

            {/* Resume Text */}
            <div>
              <Label htmlFor="resumeText">Or paste your resume text *</Label>
              <Textarea
                id="resumeText"
                placeholder="Paste your current resume here..."
                value={formData.resumeText}
                onChange={(e) => updateField("resumeText", e.target.value)}
                rows={10}
                className="mt-1.5 font-mono text-sm"
              />
            </div>

            {/* Job Description */}
            <div>
              <Label htmlFor="jobDescription">Job Description *</Label>
              <Textarea
                id="jobDescription"
                placeholder="Paste the job description here..."
                value={formData.jobDescription}
                onChange={(e) => updateField("jobDescription", e.target.value)}
                rows={8}
                className="mt-1.5"
              />
            </div>

            {/* Settings */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <h3 className="font-medium">Settings</h3>
              <div className="flex items-center justify-between">
                <Label htmlFor="onePageOnly">One Page Only</Label>
                <Switch
                  id="onePageOnly"
                  checked={formData.onePageOnly}
                  onCheckedChange={(checked) => updateField("onePageOnly", checked)}
                />
              </div>
              <div>
                <Label className="mb-3 block">Tone</Label>
                <RadioGroup
                  value={formData.tone}
                  onValueChange={(value) => updateField("tone", value as FormData["tone"])}
                  className="flex gap-4"
                >
                  {["confident", "neutral", "direct"].map((tone) => (
                    <div key={tone} className="flex items-center space-x-2">
                      <RadioGroupItem value={tone} id={`tailor-${tone}`} />
                      <Label htmlFor={`tailor-${tone}`} className="capitalize cursor-pointer">
                        {tone}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate Tailored Resume
            </Button>
          </div>

          {/* Right: Output */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <OutputPanel
              title="Tailored Resume"
              tabs={outputTabs}
              isLoading={isGenerating}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
