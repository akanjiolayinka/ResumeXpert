import { Link } from "react-router-dom";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { FeatureCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FileText,
  Target,
  BarChart3,
  Mail,
  MessageSquare,
  ClipboardPaste,
  UserPlus,
  Sparkles,
  Shield,
  Lock,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Build from Scratch",
    description: "Give us your details + job description. Get a structured, ATS-friendly resume text.",
    to: "/resume-builder",
    bullets: ["Structured inputs", "ATS-friendly output text", "One-page or two-page control"],
  },
  {
    icon: Target,
    title: "Tailor to a Job",
    description: "Turn one resume into a job-matching version without rewriting everything.",
    to: "/resume-tailor",
    bullets: ["Job keyword alignment", "Reordered skills", "Stronger bullets"],
  },
  {
    icon: BarChart3,
    title: "ATS Score + Improvements",
    description: "See what's hurting your chances and fix it fast.",
    to: "/ats-scan",
    bullets: ["Score + subscores", "Fix list (High/Med/Low)", "Missing keywords"],
  },
  {
    icon: Mail,
    title: "Cover Letter Generator",
    description: "Use the job description + your proof points to create a real cover letter.",
    to: "/cover-letter",
    bullets: ["Proof-point based", "Multiple tones", "Editable output"],
  },
  {
    icon: MessageSquare,
    title: "Career Chatbot",
    description: "Ask questions, get guidance, rewrite bullets, prep for interviews.",
    to: "/chatbot",
    bullets: ["Rewrite bullets", "Interview prep", "Career guidance"],
  },
];

const steps = [
  {
    icon: ClipboardPaste,
    title: "Paste the job description",
    description: "Copy the job posting you're applying for so we can match your resume to it.",
  },
  {
    icon: UserPlus,
    title: "Add your details",
    description: "Enter your experience, skills, and projects — or upload your existing resume.",
  },
  {
    icon: Sparkles,
    title: "Get polished results",
    description: "Receive an ATS-friendly resume, keyword analysis, and improvement suggestions.",
  },
];

const faqs = [
  {
    question: "What is an ATS score?",
    answer: "ATS (Applicant Tracking System) score is a guidance metric that estimates how well your resume matches a job description and common ATS-friendly standards. It helps you understand what to improve before applying.",
  },
  {
    question: "Do you invent experience?",
    answer: "No. ResumeXpert rewrites and structures only what you provide. If something isn't true, we don't add it. We help you present your real experience more effectively.",
  },
  {
    question: "Can I create a resume with no job experience?",
    answer: "Yes! We'll focus on projects, volunteering, coursework, and transferable skills. Many successful applications come from candidates who highlight their potential through projects and learning.",
  },
  {
    question: "One page or two pages?",
    answer: "One page is best for students and early careers (0-5 years experience). Two pages can work for experienced roles, research-heavy profiles, or when you have significant relevant achievements.",
  },
  {
    question: "What file types can I upload?",
    answer: "PDF and DOCX are supported in the full version. This demo uses pasted text and placeholder upload UI. You can always copy-paste your resume text directly.",
  },
  {
    question: "Can I edit the output?",
    answer: "Yes! You can copy the generated text into Word, Google Docs, or any text editor and customize it. Download templates are coming soon.",
  },
];

export default function Index() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="section-spacing bg-gradient-to-b from-accent/50 to-background">
        <div className="page-container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-fade-in">
              Build job-ready resumes that{" "}
              <span className="text-primary">actually match</span> the role.
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Paste a job description, add your details, and get an ATS-friendly resume, 
              a tailored version, and a cover letter — plus clear improvement tips.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <Link to="/auth/signup">
                <Button size="lg" className="text-base px-8">
                  Start free trial
                </Button>
              </Link>
              <Link to="/features">
                <Button size="lg" variant="outline" className="text-base px-8">
                  See how it works
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-spacing">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything you need to land interviews</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From building your resume to preparing for interviews, we've got you covered.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <FeatureCard key={feature.to} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section-spacing bg-muted/30">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How it works</h2>
            <p className="text-muted-foreground">Three simple steps to a better resume.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.title} className="text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground mx-auto mb-4">
                  <step.icon className="h-7 w-7" />
                </div>
                <div className="text-sm font-medium text-primary mb-2">Step {index + 1}</div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="section-spacing">
        <div className="page-container">
          <div className="max-w-3xl mx-auto">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-4 p-6 bg-card border rounded-xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">No fluff. No fake experience.</h3>
                  <p className="text-sm text-muted-foreground">
                    We only rewrite and structure what you provide. Your authenticity matters.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 bg-card border rounded-xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground shrink-0">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Your data stays private.</h3>
                  <p className="text-sm text-muted-foreground">
                    We don't store or share your personal information.{" "}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Read our privacy policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="page-container text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to upgrade your applications?
          </h2>
          <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
            Join thousands of job seekers who've improved their resumes and landed more interviews.
          </p>
          <Link to="/auth/signup">
            <Button size="lg" variant="secondary" className="text-base px-8">
              Start free trial
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-spacing">
        <div className="page-container">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Frequently asked questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
