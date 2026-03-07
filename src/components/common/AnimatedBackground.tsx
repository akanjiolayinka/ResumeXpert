import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface AnimatedBackgroundProps {
  variant?: "marketing" | "app";
  className?: string;
}

export function AnimatedBackground({ variant = "marketing", className }: AnimatedBackgroundProps) {
  const { reduceMotion } = useTheme();

  if (variant === "app") {
    return (
      <div className={cn("fixed inset-0 -z-10 overflow-hidden", className)}>
        <div className="absolute inset-0 bg-background" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/[0.05] blur-[100px]" />
      </div>
    );
  }

  return (
    <div className={cn("fixed inset-0 -z-10 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-background" />
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
      }} />
      {/* Gradient blobs */}
      <div className={cn(
        "absolute -top-[300px] -right-[200px] w-[800px] h-[800px] rounded-full bg-primary/[0.07] dark:bg-primary/[0.1] blur-[120px]",
        !reduceMotion && "animate-blob-1"
      )} />
      <div className={cn(
        "absolute -bottom-[200px] -left-[300px] w-[700px] h-[700px] rounded-full bg-[hsl(200_80%_60%/0.06)] dark:bg-[hsl(200_80%_60%/0.08)] blur-[120px]",
        !reduceMotion && "animate-blob-2"
      )} />
      <div className={cn(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-accent/[0.05] dark:bg-accent/[0.08] blur-[100px]",
        !reduceMotion && "animate-blob-3"
      )} />
    </div>
  );
}
