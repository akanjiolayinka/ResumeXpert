import { MarketingLayout as Layout, PageHeader } from "@/components/layout";
import { Link } from "react-router-dom";
import { Target, Shield, Sparkles, Users } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Accuracy over fluff",
    description: "We help you present your real experience effectively. No fake skills, no invented achievements.",
  },
  {
    icon: Shield,
    title: "Privacy first",
    description: "Your data stays on your device. We don't store or share your personal information.",
  },
  {
    icon: Sparkles,
    title: "ATS-optimized",
    description: "Every template and suggestion is designed to work with applicant tracking systems.",
  },
  {
    icon: Users,
    title: "Built for everyone",
    description: "Whether you're a student, career changer, or experienced professional, we've got you covered.",
  },
];

export default function About() {
  return (
    <Layout>
      <div className="page-container section-spacing">
        <PageHeader
          title="About ResumeXpert"
          description="We believe everyone deserves a resume that gets them noticed."
        />

        <div className="max-w-3xl mx-auto">
          {/* Mission */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Job searching is stressful enough without worrying about whether your resume will make it through 
              the applicant tracking system. We built ResumeXpert to level the playing field.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Our tools help you understand what recruiters and ATS systems look for, optimize your resume 
              for specific job descriptions, and present your experience in the most compelling way possible.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We don't write fake experience or pad your resume with skills you don't have. Instead, we help 
              you articulate your real achievements in language that resonates with hiring managers.
            </p>
          </section>

          {/* Values */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">What We Believe</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {values.map((value) => (
                <div key={value.title} className="flex gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground shrink-0">
                    <value.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* What We Offer */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-4">What We Offer</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span><strong>Resume Builder:</strong> Create ATS-friendly resumes from scratch</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span><strong>Resume Tailor:</strong> Optimize existing resumes for specific jobs</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span><strong>ATS Scanner:</strong> Get scores and actionable improvement tips</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span><strong>Cover Letter Generator:</strong> Create tailored cover letters fast</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span><strong>AI Career Chat:</strong> Get personalized career guidance</span>
              </li>
            </ul>
          </section>

          {/* CTA */}
          <section className="text-center p-8 bg-muted/30 rounded-xl">
            <h2 className="text-xl font-bold mb-2">Ready to get started?</h2>
            <p className="text-muted-foreground mb-4">
              Build your first resume in minutes.
            </p>
            <Link to="/resume-builder">
              <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                Create Your Resume
              </button>
            </Link>
          </section>
        </div>
      </div>
    </Layout>
  );
}
