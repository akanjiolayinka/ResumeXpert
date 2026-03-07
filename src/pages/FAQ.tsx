import { MarketingLayout } from "@/components/layout/MarketingLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "What is an ATS score?", a: "ATS (Applicant Tracking System) score is a guidance metric that estimates how well your resume matches a job description and common ATS-friendly standards. It helps you understand what to improve before applying." },
  { q: "Is ATS score a guarantee?", a: "No. It's a guidance tool based on keyword matching and formatting analysis. Actual ATS systems vary by company." },
  { q: "Do you invent experience?", a: "No. ResumeXpert rewrites and structures only what you provide. If something isn't true, we don't add it." },
  { q: "What if I have no job experience?", a: "We'll focus on projects, volunteering, coursework, and transferable skills. Many successful applications come from candidates who highlight their potential." },
  { q: "One page or two pages?", a: "One page is best for students and early careers (0–5 years). Two pages work for experienced roles or research-heavy profiles." },
  { q: "Can I download PDF?", a: "PDF/DOCX download is coming soon. For now, copy the generated text into Word or Google Docs." },
  { q: "Can I edit the output?", a: "Yes! Copy the generated text into any editor and customize it freely." },
  { q: "Is my data safe?", a: "Yes. Your data is stored locally in your browser. We don't share or sell personal information." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel your subscription anytime from the billing page. No questions asked." },
  { q: "What does the chatbot do?", a: "The AI career chatbot helps you rewrite bullets, prep for interviews, and get career guidance — all based on the job description you provide." },
];

export default function FAQ() {
  return (
    <MarketingLayout>
      <section className="section-spacing">
        <div className="page-container">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-4 text-center">Frequently asked questions</h1>
            <p className="text-muted-foreground text-center mb-12">Everything you need to know about ResumeXpert.</p>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
