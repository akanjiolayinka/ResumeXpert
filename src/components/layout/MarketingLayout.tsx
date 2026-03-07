import { ReactNode } from "react";
import { MarketingNavbar } from "./MarketingNavbar";
import { MarketingFooter } from "./MarketingFooter";
import { AnimatedBackground } from "@/components/common/AnimatedBackground";

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <AnimatedBackground variant="marketing" />
      <MarketingNavbar />
      <main className="flex-1 relative">{children}</main>
      <MarketingFooter />
    </div>
  );
}
