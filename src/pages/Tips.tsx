import { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, BarChart3, Linkedin, Users, Briefcase, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const categories = [
  { id: "resume", label: "Resume", icon: FileText },
  { id: "ats", label: "ATS", icon: BarChart3 },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "interviews", label: "Interviews", icon: Users },
  { id: "internships", label: "Internships", icon: Briefcase },
];

const tips = [
  {
    id: 1,
    category: "resume",
    title: "Mirror the job title in your headline",
    description: "If it fits your experience, use the exact job title from the posting in your resume headline. This helps with ATS matching.",
  },
  {
    id: 2,
    category: "resume",
    title: "Put your most relevant skills first",
    description: "The first 6-10 skills in your list get the most attention. Prioritize those that match the job description.",
  },
  {
    id: 3,
    category: "ats",
    title: "Every bullet should answer two questions",
    description: "What did you do? What changed because of it? This formula makes your achievements concrete and measurable.",
  },
  {
    id: 4,
    category: "ats",
    title: "Add numbers anywhere you can",
    description: "Quantify your impact: users reached, percentage improvements, revenue generated, time saved. Numbers stand out.",
  },
  {
    id: 5,
    category: "ats",
    title: "Avoid tables and columns",
    description: "Many ATS systems struggle to parse complex layouts. Stick to simple, linear formatting for best results.",
  },
  {
    id: 6,
    category: "resume",
    title: "Use standard section headings",
    description: "Summary, Skills, Experience, Education, Projects. Creative headings might confuse ATS parsers.",
  },
  {
    id: 7,
    category: "resume",
    title: "Tailor your first 3 bullets",
    description: "The opening bullets of each job get the most attention. Make sure they match the target role's top priorities.",
  },
  {
    id: 8,
    category: "ats",
    title: "Show outcomes, not tasks",
    description: "'Improved system performance by 40%' beats 'Responsible for system maintenance'. Lead with impact.",
  },
  {
    id: 9,
    category: "resume",
    title: "Keep your summary to 2-3 lines",
    description: "A tight, punchy summary is more effective than a dense paragraph. Hit the highlights and move on.",
  },
  {
    id: 10,
    category: "internships",
    title: "Projects can replace work experience",
    description: "For students and early-career professionals, well-documented projects with clear outcomes are just as valuable.",
  },
  {
    id: 11,
    category: "resume",
    title: "Use consistent date formatting",
    description: "Pick one format (e.g., May 2025 – Jan 2026) and use it throughout. Inconsistency looks sloppy.",
  },
  {
    id: 12,
    category: "linkedin",
    title: "Include links where relevant",
    description: "LinkedIn profile, portfolio, GitHub. Make it easy for recruiters to learn more about your work.",
  },
];

export default function Tips() {
  const [email, setEmail] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { toast } = useToast();

  const filteredTips = selectedCategory
    ? tips.filter((tip) => tip.category === selectedCategory)
    : tips;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "Enter your email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    toast({ title: "Subscribed!", description: "You'll receive weekly career tips in your inbox." });
    setEmail("");
  };

  return (
    <Layout>
      <div className="page-container section-spacing">
        {/* Coming Soon Banner */}
        <div className="bg-accent/50 border border-accent-foreground/10 rounded-xl p-6 mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-semibold text-primary">Coming Soon</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Professional Tips</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            We're building a comprehensive library of career tips. For now, enjoy these preview tips!
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="gap-2"
            >
              <cat.icon className="h-4 w-4" />
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Tips Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {filteredTips.map((tip) => {
            const category = categories.find((c) => c.id === tip.category);
            return (
              <div
                key={tip.id}
                className="bg-card border rounded-xl p-6 card-hover"
              >
                <Badge variant="secondary" className="mb-3">
                  {category?.label}
                </Badge>
                <h3 className="font-semibold mb-2">{tip.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {tip.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Email Signup */}
        <div className="max-w-xl mx-auto bg-muted/30 border rounded-xl p-8 text-center">
          <Mail className="h-10 w-10 mx-auto text-primary mb-4" />
          <h2 className="text-xl font-bold mb-2">Get tips weekly</h2>
          <p className="text-muted-foreground mb-6">
            Subscribe to receive career tips and resume advice directly in your inbox.
          </p>
          <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Subscribe</Button>
          </form>
          <p className="text-xs text-muted-foreground mt-3">
            No spam, ever. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </Layout>
  );
}
