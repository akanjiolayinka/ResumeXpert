import { cn } from "@/lib/utils";

interface ScoreMeterProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ScoreMeter({ score, size = "md", showLabel = true, className }: ScoreMeterProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  
  const getScoreColor = (s: number) => {
    if (s >= 80) return "hsl(142, 72%, 40%)"; // excellent - green
    if (s >= 60) return "hsl(168, 80%, 32%)"; // good - teal
    if (s >= 40) return "hsl(38, 92%, 50%)"; // fair - orange
    return "hsl(0, 72%, 51%)"; // poor - red
  };
  
  const getScoreLabel = (s: number) => {
    if (s >= 80) return "Excellent";
    if (s >= 60) return "Good";
    if (s >= 40) return "Fair";
    return "Needs Work";
  };

  const sizes = {
    sm: { container: 80, stroke: 6, text: "text-xl", label: "text-xs" },
    md: { container: 120, stroke: 8, text: "text-3xl", label: "text-sm" },
    lg: { container: 160, stroke: 10, text: "text-4xl", label: "text-base" },
  };

  const { container, stroke, text, label } = sizes[size];
  const radius = (container - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: container, height: container }}>
        <svg
          className="transform -rotate-90"
          width={container}
          height={container}
        >
          {/* Background circle */}
          <circle
            cx={container / 2}
            cy={container / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={stroke}
          />
          {/* Score circle */}
          <circle
            cx={container / 2}
            cy={container / 2}
            r={radius}
            fill="none"
            stroke={getScoreColor(clampedScore)}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
            style={{
              "--score-offset": offset,
            } as React.CSSProperties}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold", text)}>{clampedScore}</span>
          {showLabel && (
            <span className={cn("text-muted-foreground", label)}>
              {getScoreLabel(clampedScore)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
