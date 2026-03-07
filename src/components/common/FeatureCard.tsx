import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
  bullets?: string[];
  className?: string;
}

export function FeatureCard({ icon: Icon, title, description, to, bullets, className }: FeatureCardProps) {
  return (
    <Link
      to={to}
      className={cn(
        "group relative block p-6 bg-card/80 backdrop-blur-sm border rounded-xl transition-all duration-300",
        "hover:shadow-[0_8px_30px_-4px_hsl(var(--primary)/0.12)] hover:-translate-y-1",
        "hover:border-primary/30 dark:hover:border-primary/40",
        "hover:bg-card",
        className
      )}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="relative">
        <div className="flex items-center gap-4 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        {bullets && bullets.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-1 h-1 w-1 rounded-full bg-primary/60 shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}
