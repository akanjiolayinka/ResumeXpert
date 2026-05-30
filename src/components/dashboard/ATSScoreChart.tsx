import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useATSScores } from "@/lib/queries/atsScores";

function formatShortDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

export function ATSScoreChart() {
  const { data: scores, isLoading } = useATSScores();

  const points = useMemo(
    () =>
      (scores ?? []).map((s) => ({
        date: formatShortDate(s.created_at),
        overall: s.overall,
      })),
    [scores],
  );

  if (isLoading) return null;

  // Hide the section entirely below the 2-point threshold per the brief —
  // a single point isn't a trend.
  if (points.length < 2) return null;

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="font-semibold mb-3">ATS Score History</h3>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "hsl(var(--muted-foreground))" }}
            />
            <Line
              type="monotone"
              dataKey="overall"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
