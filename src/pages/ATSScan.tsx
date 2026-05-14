import { useState, useEffect } from "react";
import { Layout, PageHeader } from "@/components/layout";
import { ScoreMeter } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle, CheckCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveToLocalStorage, loadFromLocalStorage } from "@/lib/storage";
import { calculateATSScore } from "@/lib/resume-utils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ResumeUploader } from "@/components/upload/ResumeUploader";

interface FormData {
  resumeText: string;
  jobDescription: string;
}

const defaultFormData: FormData = {
  resumeText: "",
  jobDescription: "",
};

const STORAGE_KEY = "ats_scan_form";

export default function ATSScan() {
  const [formData, setFormData] = useState<FormData>(() =>
    loadFromLocalStorage(STORAGE_KEY, defaultFormData)
  );
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof calculateATSScore> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    saveToLocalStorage(STORAGE_KEY, formData);
  }, [formData]);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleScan = async () => {
    if (!formData.resumeText.trim()) {
      toast({ title: "Missing resume", description: "Please paste your resume text.", variant: "destructive" });
      return;
    }

    setIsScanning(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const scoreResult = calculateATSScore(formData.resumeText, formData.jobDescription || undefined);
    setResult(scoreResult);

    setIsScanning(false);
    toast({ title: "Scan complete!", description: `Your ATS score is ${scoreResult.overall}.` });
  };

  const getSubscoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getPriorityIcon = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "medium":
        return <Info className="h-4 w-4 text-warning" />;
      case "low":
        return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityBadge = (priority: "high" | "medium" | "low") => {
    const variants = {
      high: "bg-destructive/10 text-destructive border-destructive/20",
      medium: "bg-warning/10 text-warning border-warning/20",
      low: "bg-muted text-muted-foreground border-muted",
    };
    return (
      <Badge variant="outline" className={cn("text-xs", variants[priority])}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

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
          <div className="space-y-6">
            <ResumeUploader
              compact
              onUploaded={(resume) => {
                updateField("resumeText", resume.raw_text);
                toast({
                  title: resume.parse_failed ? "Partial parse" : "Resume uploaded",
                  description: resume.parse_failed
                    ? "We extracted the text but couldn't structure all sections."
                    : "Your resume text is ready below.",
                });
              }}
            />

            <div>
              <Label htmlFor="resumeText">Resume Text *</Label>
              <Textarea
                id="resumeText"
                placeholder="Paste your resume here..."
                value={formData.resumeText}
                onChange={(e) => updateField("resumeText", e.target.value)}
                rows={12}
                className="mt-1.5 font-mono text-sm"
              />
            </div>

            <div>
              <Label htmlFor="jobDescription">Job Description (optional)</Label>
              <Textarea
                id="jobDescription"
                placeholder="Paste the job description for keyword matching..."
                value={formData.jobDescription}
                onChange={(e) => updateField("jobDescription", e.target.value)}
                rows={6}
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Adding a job description improves keyword matching analysis.
              </p>
            </div>

            <Button onClick={handleScan} disabled={isScanning} className="w-full">
              {isScanning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Scan Resume
            </Button>
          </div>

          {/* Right: Results */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {isScanning ? (
              <div className="bg-card border rounded-xl p-8 text-center">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Analyzing your resume...</p>
              </div>
            ) : result ? (
              <div className="bg-card border rounded-xl p-6 space-y-6">
                {/* Score */}
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-4">Your ATS Score</h3>
                  <ScoreMeter score={result.overall} size="lg" />
                </div>

                {/* Subscores */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Keyword Match", score: result.keywordMatch },
                    { label: "Structure", score: result.structure },
                    { label: "Formatting", score: result.formatting },
                    { label: "Impact", score: result.impact },
                  ].map((item) => (
                    <div key={item.label} className="p-3 bg-muted/50 rounded-lg text-center">
                      <div className={cn("text-2xl font-bold", getSubscoreColor(item.score))}>
                        {item.score}
                      </div>
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                    </div>
                  ))}
                </div>

                {/* Fix List */}
                <div>
                  <h4 className="font-semibold mb-3">Priority Fixes</h4>
                  <div className="space-y-2">
                    {result.fixes.map((fix, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                      >
                        {getPriorityIcon(fix.priority)}
                        <div className="flex-1">
                          <p className="text-sm">{fix.text}</p>
                        </div>
                        {getPriorityBadge(fix.priority)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing Keywords */}
                {result.missingKeywords.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Missing Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.missingKeywords.map((kw) => (
                        <Badge key={kw} variant="outline">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <p className="text-xs text-muted-foreground text-center pt-2 border-t">
                  This is a guidance score based on common ATS patterns, not a guarantee of success.
                </p>
              </div>
            ) : (
              <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground">
                <p>Paste your resume and click "Scan Resume" to see your ATS score and improvement suggestions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
