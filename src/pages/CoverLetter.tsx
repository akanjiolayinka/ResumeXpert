import { useState, useEffect } from "react";
import { Layout, PageHeader } from "@/components/layout";
import { OutputPanel } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveToLocalStorage, loadFromLocalStorage } from "@/lib/storage";
import { generateCoverLetter } from "@/lib/resume-utils";

interface FormData {
  jobDescription: string;
  companyName: string;
  roleTitle: string;
  proofPoints: string[];
  fullName: string;
  tone: "warm" | "direct" | "enthusiastic";
}

const defaultFormData: FormData = {
  jobDescription: "",
  companyName: "",
  roleTitle: "",
  proofPoints: [""],
  fullName: "",
  tone: "warm",
};

const STORAGE_KEY = "cover_letter_form";

export default function CoverLetter() {
  const [formData, setFormData] = useState<FormData>(() =>
    loadFromLocalStorage(STORAGE_KEY, defaultFormData)
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEY, formData);
  }, [formData]);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addProofPoint = () => {
    updateField("proofPoints", [...formData.proofPoints, ""]);
  };

  const removeProofPoint = (index: number) => {
    if (formData.proofPoints.length > 1) {
      updateField("proofPoints", formData.proofPoints.filter((_, i) => i !== index));
    }
  };

  const updateProofPoint = (index: number, value: string) => {
    updateField(
      "proofPoints",
      formData.proofPoints.map((p, i) => (i === index ? value : p))
    );
  };

  const handleGenerate = async () => {
    if (!formData.jobDescription.trim()) {
      toast({ title: "Missing info", description: "Please paste the job description.", variant: "destructive" });
      return;
    }
    if (!formData.companyName.trim()) {
      toast({ title: "Missing info", description: "Please enter the company name.", variant: "destructive" });
      return;
    }
    if (!formData.roleTitle.trim()) {
      toast({ title: "Missing info", description: "Please enter the role title.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const letter = generateCoverLetter({
      roleTitle: formData.roleTitle,
      companyName: formData.companyName,
      jobDescription: formData.jobDescription,
      proofPoints: formData.proofPoints.filter(Boolean),
      fullName: formData.fullName,
      tone: formData.tone,
    });

    setGeneratedLetter(letter);
    setIsGenerating(false);
    toast({ title: "Cover letter generated!", description: "Your cover letter is ready." });
  };

  const outputTabs = generatedLetter
    ? [
        {
          id: "letter",
          label: "Cover Letter",
          content: generatedLetter,
        },
      ]
    : [
        {
          id: "letter",
          label: "Cover Letter",
          content: 'Fill in the details and click "Generate Cover Letter" to create your personalized cover letter.',
        },
      ];

  return (
    <Layout>
      <div className="page-container section-spacing">
        <PageHeader
          title="Cover Letter Generator"
          description="Create a tailored cover letter that highlights your achievements and matches the job requirements."
        />

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-6">
            <div>
              <Label htmlFor="jobDescription">Job Description *</Label>
              <Textarea
                id="jobDescription"
                placeholder="Paste the job description here..."
                value={formData.jobDescription}
                onChange={(e) => updateField("jobDescription", e.target.value)}
                rows={6}
                className="mt-1.5"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  placeholder="e.g., Google"
                  value={formData.companyName}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="roleTitle">Role Title *</Label>
                <Input
                  id="roleTitle"
                  placeholder="e.g., Software Engineer"
                  value={formData.roleTitle}
                  onChange={(e) => updateField("roleTitle", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="fullName">Your Name (optional)</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                className="mt-1.5"
              />
            </div>

            {/* Proof Points */}
            <div>
              <Label className="mb-3 block">Your Proof Points / Achievements</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Add 2-4 specific achievements or projects that demonstrate your value.
              </p>
              <div className="space-y-3">
                {formData.proofPoints.map((point, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Achievement ${index + 1}...`}
                      value={point}
                      onChange={(e) => updateProofPoint(index, e.target.value)}
                    />
                    {formData.proofPoints.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeProofPoint(index)}
                        className="shrink-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addProofPoint}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Proof Point
                </Button>
              </div>
            </div>

            {/* Tone */}
            <div className="p-4 border rounded-lg bg-muted/20">
              <Label className="mb-3 block">Tone</Label>
              <RadioGroup
                value={formData.tone}
                onValueChange={(value) => updateField("tone", value as FormData["tone"])}
                className="flex flex-col gap-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="warm" id="warm" />
                  <Label htmlFor="warm" className="cursor-pointer">
                    <span className="font-medium">Warm Professional</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      Friendly and personable
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="direct" id="direct" />
                  <Label htmlFor="direct" className="cursor-pointer">
                    <span className="font-medium">Direct Professional</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      Concise and to-the-point
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="enthusiastic" id="enthusiastic" />
                  <Label htmlFor="enthusiastic" className="cursor-pointer">
                    <span className="font-medium">Enthusiastic</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      Energetic and passionate
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate Cover Letter
            </Button>
          </div>

          {/* Right: Output */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <OutputPanel
              title="Your Cover Letter"
              tabs={outputTabs}
              isLoading={isGenerating}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
