import { Link } from "react-router-dom";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { Button } from "@/components/ui/button";
import { FileText, Target, BarChart3, Mail, MessageSquare } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Build from Scratch",
    description: "Give us your details + job description. Get a structured, ATS-friendly resume text.",
    bullets: ["Structured inputs", "ATS-friendly output text", "One-page or two-page control"],
  },
  {
    icon: Target,
    title: "Tailor to a Job",
    description: "Turn one resume into a job-matching version without rewriting everything.",
    bullets: ["Job keyword alignment", "Reordered skills", "Stronger bullets"],
  },
  {
    icon: BarChart3,
    title: "ATS Score + Improvements",
    description: "See what's hurting your chances and fix it fast.",
    bullets: ["Score + subscores", "Fix list (High/Med/Low)", "Missing keywords"],
  },
  {
    icon: Mail,
    title: "Cover Letter Generator",
    description: "Use the job description + your proof points to create a real cover letter.",
    bullets: ["Proof-point based", "Multiple tones", "Editable output"],
  },
  {
    icon: MessageSquare,
    title: "Career Chatbot",
    description: "Ask questions, get guidance, rewrite bullets, prep for interviews.",
    bullets: ["Ask career questions", "Rewrite bullets", "Interview prep prompts"],
  },
];

export default function Features() {
  return (
    <MarketingLayout>
      <section className="section-spacing">
        <div className="page-container">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Everything you need to apply with confidence.</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From building your resume to prepping for interviews — one platform, no fluff.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative p-6 bg-card/80 backdrop-blur-sm border rounded-xl transition-all duration-300 hover:shadow-[0_8px_30px_-4px_hsl(var(--primary)/0.12)] hover:-translate-y-1 hover:border-primary/30"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300 mb-4">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm mb-3">{f.description}</p>
                  <ul className="space-y-1.5">
                    {f.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="mt-1 h-1 w-1 rounded-full bg-primary/60 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-16">
            <Link to="/auth/signup">
              <Button size="lg">Start free trial</Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
