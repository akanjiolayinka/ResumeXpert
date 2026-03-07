import { useState } from "react";
import { Link } from "react-router-dom";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Trying ResumeXpert",
    features: [
      "3 ATS scans per day",
      "2 resume generations per day",
      "2 cover letters per day",
      "Basic keyword gap suggestions",
      "Last 5 items in history",
    ],
    cta: "Get started free",
    popular: false,
  },
  {
    name: "Pro",
    monthlyPrice: 4,
    yearlyPrice: 40,
    description: "For serious job seekers",
    features: [
      "Unlimited ATS scans",
      "Unlimited resume builder + tailoring",
      "Unlimited cover letters",
      "Full history (unlimited)",
      "Advanced improvements checklist",
      "Priority output formatting",
    ],
    cta: "Start free trial",
    popular: true,
    trial: "7-day free trial",
  },
  {
    name: "Team",
    monthlyPrice: 12,
    yearlyPrice: 120,
    description: "For career centers & teams",
    features: [
      "Everything in Pro",
      "5 team members",
      "Shared templates (coming soon)",
      "Admin controls (coming soon)",
    ],
    cta: "Start Team trial",
    popular: false,
    trial: "7-day free trial",
  },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <MarketingLayout>
      <section className="section-spacing">
        <div className="page-container">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Simple pricing that's actually affordable.</h1>
            <p className="text-lg text-muted-foreground mb-8">Start free. Upgrade when you need more power.</p>
            <div className="flex items-center justify-center gap-3">
              <span className={`text-sm ${!yearly ? "text-foreground font-medium" : "text-muted-foreground"}`}>Monthly</span>
              <Switch checked={yearly} onCheckedChange={setYearly} />
              <span className={`text-sm ${yearly ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                Yearly <span className="text-primary text-xs">(2 months free)</span>
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-6 rounded-xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  plan.popular ? "border-primary shadow-[0_0_20px_-4px_hsl(var(--primary)/0.2)]" : ""
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
                )}
                <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    ${yearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span className="text-muted-foreground text-sm">/{yearly ? "year" : "month"}</span>
                  )}
                </div>
                {plan.trial && (
                  <p className="text-xs text-muted-foreground mb-4">{plan.trial} — no credit card required</p>
                )}
                <Link to="/auth/signup">
                  <Button className="w-full mb-6" variant={plan.popular ? "default" : "outline"}>
                    {plan.cta}
                  </Button>
                </Link>
                <ul className="space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="text-center mt-12 space-y-1 text-sm text-muted-foreground">
            <p>Cancel anytime. Your results depend on the information you provide.</p>
            <p>We never invent experience.</p>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
