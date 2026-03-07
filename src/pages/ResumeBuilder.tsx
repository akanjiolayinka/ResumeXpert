import { useState, useEffect } from "react";
import { Layout, PageHeader } from "@/components/layout";
import { FormSection, TagInput, OutputPanel } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Trash2, ChevronDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveToLocalStorage, loadFromLocalStorage, clearLocalStorage } from "@/lib/storage";
import { sampleProfiles, generateResumeText, extractKeywords } from "@/lib/resume-utils";
import { Badge } from "@/components/ui/badge";

interface Experience {
  id: string;
  company: string;
  role: string;
  dates: string;
  description: string;
  metrics: string;
}

interface Project {
  id: string;
  name: string;
  link: string;
  stack: string;
  description: string;
  contribution: string;
  results: string;
}

interface FormData {
  jobDescription: string;
  companyName: string;
  roleTitle: string;
  onePageOnly: boolean;
  tone: "confident" | "neutral" | "direct";
  includeProjects: boolean;
  includeCertifications: boolean;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
  summary: string;
  skills: string[];
  experiences: Experience[];
  projects: Project[];
  school: string;
  degree: string;
  eduDates: string;
  gpa: string;
  certifications: string;
  awards: string;
  volunteering: string;
}

const defaultFormData: FormData = {
  jobDescription: "",
  companyName: "",
  roleTitle: "",
  onePageOnly: true,
  tone: "neutral",
  includeProjects: true,
  includeCertifications: true,
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  portfolio: "",
  summary: "",
  skills: [],
  experiences: [{ id: "1", company: "", role: "", dates: "", description: "", metrics: "" }],
  projects: [{ id: "1", name: "", link: "", stack: "", description: "", contribution: "", results: "" }],
  school: "",
  degree: "",
  eduDates: "",
  gpa: "",
  certifications: "",
  awards: "",
  volunteering: "",
};

const STORAGE_KEY = "resume_builder_form";

export default function ResumeBuilder() {
  const [formData, setFormData] = useState<FormData>(() => 
    loadFromLocalStorage(STORAGE_KEY, defaultFormData)
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{
    resume: string;
    keywords: string[];
    improvements: string[];
  } | null>(null);
  const { toast } = useToast();

  // Save to localStorage on change
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEY, formData);
  }, [formData]);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      company: "",
      role: "",
      dates: "",
      description: "",
      metrics: "",
    };
    updateField("experiences", [...formData.experiences, newExp]);
  };

  const removeExperience = (id: string) => {
    if (formData.experiences.length > 1) {
      updateField("experiences", formData.experiences.filter((e) => e.id !== id));
    }
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    updateField(
      "experiences",
      formData.experiences.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const addProject = () => {
    const newProj: Project = {
      id: Date.now().toString(),
      name: "",
      link: "",
      stack: "",
      description: "",
      contribution: "",
      results: "",
    };
    updateField("projects", [...formData.projects, newProj]);
  };

  const removeProject = (id: string) => {
    if (formData.projects.length > 1) {
      updateField("projects", formData.projects.filter((p) => p.id !== id));
    }
  };

  const updateProject = (id: string, field: keyof Project, value: string) => {
    updateField(
      "projects",
      formData.projects.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const loadSampleProfile = (profileKey: keyof typeof sampleProfiles) => {
    const profile = sampleProfiles[profileKey];
    setFormData({
      ...defaultFormData,
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      linkedin: profile.linkedin,
      portfolio: profile.portfolio,
      summary: profile.summary,
      skills: profile.skills,
      experiences: profile.experiences.map((exp, i) => ({
        id: String(i + 1),
        company: exp.company,
        role: exp.role,
        dates: exp.dates,
        description: exp.description,
        metrics: exp.metrics || "",
      })),
      projects: profile.projects.map((proj, i) => ({
        id: String(i + 1),
        name: proj.name,
        link: proj.link,
        stack: proj.stack,
        description: proj.description,
        contribution: proj.contribution,
        results: proj.results || "",
      })),
      school: profile.education.school,
      degree: profile.education.degree,
      eduDates: profile.education.dates,
      gpa: profile.education.gpa,
      certifications: profile.certifications.join("\n"),
      volunteering: profile.volunteering.join("\n"),
    });
    toast({ title: "Sample loaded", description: "Sample profile has been loaded into the form." });
  };

  const clearForm = () => {
    setFormData(defaultFormData);
    clearLocalStorage(STORAGE_KEY);
    setGeneratedContent(null);
    toast({ title: "Form cleared", description: "All fields have been reset." });
  };

  const handleGenerate = async () => {
    // Validation
    if (!formData.fullName.trim()) {
      toast({ title: "Missing info", description: "Please enter your full name.", variant: "destructive" });
      return;
    }
    if (!formData.email.trim()) {
      toast({ title: "Missing info", description: "Please enter your email.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const resumeText = generateResumeText({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      location: formData.location,
      linkedin: formData.linkedin,
      portfolio: formData.portfolio,
      summary: formData.summary,
      skills: formData.skills,
      experiences: formData.experiences.filter((e) => e.company || e.role),
      projects: formData.includeProjects
        ? formData.projects.filter((p) => p.name)
        : [],
      education: {
        school: formData.school,
        degree: formData.degree,
        dates: formData.eduDates,
        gpa: formData.gpa,
      },
      certifications: formData.includeCertifications
        ? formData.certifications.split("\n").filter(Boolean)
        : [],
      volunteering: formData.volunteering.split("\n").filter(Boolean),
      targetRole: formData.roleTitle,
      targetCompany: formData.companyName,
    });

    const jdKeywords = formData.jobDescription
      ? extractKeywords(formData.jobDescription)
      : [];
    const resumeKeywords = new Set(extractKeywords(resumeText));
    const missingKeywords = jdKeywords.filter((k) => !resumeKeywords.has(k)).slice(0, 8);

    const improvements = [
      "Add measurable impact to 2–3 bullets (numbers, speed, cost, users)",
      "Reorder skills to match the job description keywords",
      'Make bullets outcome-focused: action + what + result',
      "Ensure consistent date formatting (e.g., May 2025 – Jan 2026)",
      "Add links for portfolio/GitHub if applicable",
      "Keep formatting ATS-safe: avoid tables, icons, columns, and images",
    ];

    setGeneratedContent({
      resume: resumeText,
      keywords: missingKeywords,
      improvements,
    });

    setIsGenerating(false);
    toast({ title: "Resume generated!", description: "Your resume is ready. Check the output panel." });
  };

  const outputTabs = generatedContent
    ? [
        {
          id: "resume",
          label: "Resume Text",
          content: generatedContent.resume,
        },
        {
          id: "keywords",
          label: "Keyword Gaps",
          content: (
            <div className="space-y-4 p-4">
              {generatedContent.keywords.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    These keywords from the job description may be worth including:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {generatedContent.keywords.map((kw) => (
                      <Badge key={kw} variant="secondary">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground mt-4">
                    <p className="font-medium mb-2">Suggested placement:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Skills section: Add relevant technical keywords</li>
                      <li>Experience bullets: Incorporate action-oriented keywords</li>
                      <li>Projects: Highlight matching technologies</li>
                    </ul>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Paste a job description to see keyword gap analysis.
                </p>
              )}
            </div>
          ),
        },
        {
          id: "improvements",
          label: "Improvements",
          content: (
            <div className="space-y-3 p-4">
              <p className="text-sm font-medium mb-3">Top improvements (prioritized):</p>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-destructive uppercase">High Priority</p>
                {generatedContent.improvements.slice(0, 3).map((imp, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground">{i + 1}.</span>
                    <span>{imp}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 mt-4">
                <p className="text-xs font-semibold text-warning uppercase">Medium Priority</p>
                {generatedContent.improvements.slice(3, 5).map((imp, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground">{i + 4}.</span>
                    <span>{imp}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 mt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Low Priority</p>
                {generatedContent.improvements.slice(5).map((imp, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground">{i + 6}.</span>
                    <span>{imp}</span>
                  </div>
                ))}
              </div>
            </div>
          ),
        },
      ]
    : [
        {
          id: "resume",
          label: "Resume Text",
          content:
            'Fill out the form and click "Generate Resume Text" to see your generated resume here.',
        },
      ];

  return (
    <Layout>
      <div className="page-container section-spacing">
        <PageHeader
          title="Resume Builder"
          description="Create a professional resume from scratch. Fill in your details and let us format it for ATS compatibility."
          helperText="All fields are saved automatically so you can come back anytime."
        />

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-4">
            {/* Job Description */}
            <FormSection title="Job Description" description="Paste the job you're applying for">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="jobDescription">Job Description</Label>
                  <Textarea
                    id="jobDescription"
                    placeholder="Paste the job description here..."
                    value={formData.jobDescription}
                    onChange={(e) => updateField("jobDescription", e.target.value)}
                    rows={5}
                    className="mt-1.5"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Company Name (optional)</Label>
                    <Input
                      id="companyName"
                      placeholder="e.g., Google"
                      value={formData.companyName}
                      onChange={(e) => updateField("companyName", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="roleTitle">Role Title (optional)</Label>
                    <Input
                      id="roleTitle"
                      placeholder="e.g., Software Engineer"
                      value={formData.roleTitle}
                      onChange={(e) => updateField("roleTitle", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Resume Settings */}
            <FormSection title="Resume Settings" description="Customize your resume format">
              <div className="space-y-4">
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
                        <RadioGroupItem value={tone} id={tone} />
                        <Label htmlFor={tone} className="capitalize cursor-pointer">
                          {tone}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeProjects"
                    checked={formData.includeProjects}
                    onCheckedChange={(checked) => updateField("includeProjects", checked as boolean)}
                  />
                  <Label htmlFor="includeProjects" className="cursor-pointer">
                    Include Projects section
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeCertifications"
                    checked={formData.includeCertifications}
                    onCheckedChange={(checked) => updateField("includeCertifications", checked as boolean)}
                  />
                  <Label htmlFor="includeCertifications" className="cursor-pointer">
                    Include Certifications
                  </Label>
                </div>
              </div>
            </FormSection>

            {/* Personal Info */}
            <FormSection title="Personal Info" description="Your contact details">
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => updateField("fullName", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="+1 234 567 8900"
                      value={formData.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="City, Country"
                      value={formData.location}
                      onChange={(e) => updateField("location", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      placeholder="linkedin.com/in/johndoe"
                      value={formData.linkedin}
                      onChange={(e) => updateField("linkedin", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="portfolio">Portfolio / GitHub</Label>
                    <Input
                      id="portfolio"
                      placeholder="github.com/johndoe"
                      value={formData.portfolio}
                      onChange={(e) => updateField("portfolio", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Professional Summary */}
            <FormSection title="Professional Summary" description="Optional raw notes" defaultOpen={false}>
              <div>
                <Label htmlFor="summary">Summary Notes</Label>
                <Textarea
                  id="summary"
                  placeholder="Write a few notes about your background and goals. We'll help format it."
                  value={formData.summary}
                  onChange={(e) => updateField("summary", e.target.value)}
                  rows={3}
                  className="mt-1.5"
                />
              </div>
            </FormSection>

            {/* Skills */}
            <FormSection title="Skills" description="Add your technical and soft skills">
              <div>
                <Label>Skills</Label>
                <TagInput
                  value={formData.skills}
                  onChange={(skills) => updateField("skills", skills)}
                  placeholder="Add a skill..."
                  className="mt-1.5"
                />
              </div>
            </FormSection>

            {/* Experience */}
            <FormSection title="Experience" description="Add your work experience">
              <div className="space-y-6">
                {formData.experiences.map((exp, index) => (
                  <div key={exp.id} className="p-4 border rounded-lg bg-muted/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Experience {index + 1}</span>
                      {formData.experiences.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExperience(exp.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Company/Organization</Label>
                        <Input
                          placeholder="Company name"
                          value={exp.company}
                          onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Input
                          placeholder="Your job title"
                          value={exp.role}
                          onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Dates</Label>
                      <Input
                        placeholder="Jun 2024 – Present"
                        value={exp.dates}
                        onChange={(e) => updateExperience(exp.id, "dates", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>What I Did (raw notes)</Label>
                      <Textarea
                        placeholder="Describe your responsibilities and achievements..."
                        value={exp.description}
                        onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                        rows={3}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Impact/Metrics (optional)</Label>
                      <Input
                        placeholder="e.g., Increased sales by 20%"
                        value={exp.metrics}
                        onChange={(e) => updateExperience(exp.id, "metrics", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addExperience} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Experience
                </Button>
              </div>
            </FormSection>

            {/* Projects */}
            <FormSection title="Projects" description="Add your personal or professional projects" defaultOpen={false}>
              <div className="space-y-6">
                {formData.projects.map((proj, index) => (
                  <div key={proj.id} className="p-4 border rounded-lg bg-muted/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Project {index + 1}</span>
                      {formData.projects.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProject(proj.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Project Name</Label>
                        <Input
                          placeholder="My Awesome Project"
                          value={proj.name}
                          onChange={(e) => updateProject(proj.id, "name", e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label>Link (optional)</Label>
                        <Input
                          placeholder="github.com/..."
                          value={proj.link}
                          onChange={(e) => updateProject(proj.id, "link", e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Tech Stack</Label>
                      <Input
                        placeholder="React, Node.js, PostgreSQL"
                        value={proj.stack}
                        onChange={(e) => updateProject(proj.id, "stack", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>What it does</Label>
                      <Textarea
                        placeholder="Describe what the project does..."
                        value={proj.description}
                        onChange={(e) => updateProject(proj.id, "description", e.target.value)}
                        rows={2}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Your Contribution</Label>
                      <Textarea
                        placeholder="What you built or your role..."
                        value={proj.contribution}
                        onChange={(e) => updateProject(proj.id, "contribution", e.target.value)}
                        rows={2}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Results/Metrics (optional)</Label>
                      <Input
                        placeholder="e.g., 1000+ users, 4.8 rating"
                        value={proj.results}
                        onChange={(e) => updateProject(proj.id, "results", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addProject} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
              </div>
            </FormSection>

            {/* Education */}
            <FormSection title="Education" description="Your educational background">
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="school">School/University</Label>
                    <Input
                      id="school"
                      placeholder="University of Lagos"
                      value={formData.school}
                      onChange={(e) => updateField("school", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="degree">Degree</Label>
                    <Input
                      id="degree"
                      placeholder="B.Sc. Computer Science"
                      value={formData.degree}
                      onChange={(e) => updateField("degree", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eduDates">Dates</Label>
                    <Input
                      id="eduDates"
                      placeholder="2021 – 2025"
                      value={formData.eduDates}
                      onChange={(e) => updateField("eduDates", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gpa">GPA (optional)</Label>
                    <Input
                      id="gpa"
                      placeholder="3.8"
                      value={formData.gpa}
                      onChange={(e) => updateField("gpa", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Extras */}
            <FormSection title="Extras" description="Certifications, awards, volunteering" defaultOpen={false}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="certifications">Certifications (one per line)</Label>
                  <Textarea
                    id="certifications"
                    placeholder="AWS Cloud Practitioner&#10;Google Data Analytics Certificate"
                    value={formData.certifications}
                    onChange={(e) => updateField("certifications", e.target.value)}
                    rows={3}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="awards">Awards (one per line)</Label>
                  <Textarea
                    id="awards"
                    placeholder="Dean's List 2024&#10;Hackathon Winner"
                    value={formData.awards}
                    onChange={(e) => updateField("awards", e.target.value)}
                    rows={2}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="volunteering">Volunteering/Leadership (one per line)</Label>
                  <Textarea
                    id="volunteering"
                    placeholder="Tech Lead, Google DSC&#10;Volunteer, Local NGO"
                    value={formData.volunteering}
                    onChange={(e) => updateField("volunteering", e.target.value)}
                    rows={2}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </FormSection>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button onClick={handleGenerate} disabled={isGenerating} className="flex-1">
                {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Generate Resume Text
              </Button>
              <Button variant="outline" onClick={clearForm}>
                Clear Form
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost">
                    Use a sample <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => loadSampleProfile("entry-swe")}>
                    Entry-level SWE
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => loadSampleProfile("data-analyst")}>
                    Data Analyst Intern
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => loadSampleProfile("product-designer")}>
                    Product Designer Intern
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Right: Output Panel */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <OutputPanel
              title="Your Resume (Copy & Paste)"
              tabs={outputTabs}
              isLoading={isGenerating}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
