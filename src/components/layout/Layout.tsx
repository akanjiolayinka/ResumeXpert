import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { AnimatedBackground } from "@/components/common/AnimatedBackground";

interface LayoutProps {
  children: ReactNode;
  backgroundVariant?: "marketing" | "app";
}

export function Layout({ children, backgroundVariant = "marketing" }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <AnimatedBackground variant={backgroundVariant} />
      <Navbar />
      <main className="flex-1 relative">{children}</main>
      <Footer />
    </div>
  );
}
