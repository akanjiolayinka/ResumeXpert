import { Link } from "react-router-dom";
import { FileText, Mail, Linkedin, Twitter } from "lucide-react";

const footerLinks = {
  product: [
    { to: "/features", label: "Features" },
    { to: "/pricing", label: "Pricing" },
    { to: "/faq", label: "FAQ" },
  ],
  company: [
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ],
  legal: [
    { to: "/privacy", label: "Privacy Policy" },
    { to: "/terms", label: "Terms of Service" },
  ],
};

export function MarketingFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="page-container py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-semibold text-lg mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <span>ResumeXpert</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Build job-ready resumes that actually match the role.
            </p>
            <p className="text-sm text-muted-foreground">support@resumexpert.com</p>
          </div>
          {Object.entries(footerLinks).map(([key, links]) => (
            <div key={key}>
              <h3 className="font-semibold text-sm mb-4 capitalize">{key}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} ResumeXpert. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
