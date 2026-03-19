"use client";

import { useState, useEffect, useRef } from "react";
import { formatHours } from "@/lib/utils";
import { useTheme } from "@/components/providers/ThemeProvider";

interface Goal {
  id: string;
  name: string;
  emoji: string;
}

interface StepData {
  name: string;
  hours: number;
}

interface GoalBreakdownSectionProps {
  goals: Goal[];
  period: string;
}

// Donut colours — cycles through primary, success, streak, purple, sky
const COLOURS = [
  "var(--color-primary)",
  "var(--color-success)",
  "var(--color-streak)",
  "#a855f7",
  "#38bdf8",
  "#f472b6",
  "#fb923c",
];

function DonutChart({
  steps,
  totalHours,
}: {
  steps: StepData[];
  totalHours: number;
}) {
  const size = 80;
  const r = 28;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const strokeWidth = 10;

  if (totalHours === 0) {
    return (
      <svg width={size} height={size} className="flex-shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth={strokeWidth} />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" className="text-[10px]" fill="var(--color-text-secondary)" fontSize={9}>
          No data
        </text>
      </svg>
    );
  }

  // Build segments
  let offset = 0;
  const gap = 2; // degrees gap between segments
  const segments = steps
    .filter((s) => s.hours > 0)
    .map((s, i) => {
      const fraction = s.hours / totalHours;
      const dashLen = Math.max(fraction * circ - (gap / 360) * circ, 1);
      const seg = { dashLen, offset, colour: COLOURS[i % COLOURS.length] };
      offset += fraction * circ;
      return seg;
    });

  return (
    <svg width={size} height={size} className="flex-shrink-0 -rotate-90">
      {/* track */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="var(--color-surface-2)"
        strokeWidth={strokeWidth}
      />
      {/* segments */}
      {segments.map((seg, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={seg.colour}
          strokeWidth={strokeWidth}
          strokeDasharray={`${seg.dashLen} ${circ - seg.dashLen}`}
          strokeDashoffset={-seg.offset}
          strokeLinecap="round"
        />
      ))}
      {/* center label */}
      <text
        x={cx} y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--color-text-primary)"
        fontSize={10}
        fontWeight={600}
        style={{ transform: "rotate(90deg)", transformOrigin: `${cx}px ${cy}px` }}
      >
        {formatHours(totalHours)}
      </text>
    </svg>
  );
}

function GoalCard({
  goal,
  period,
}: {
  goal: Goal;
  period: string;
}) {
  const [steps, setSteps] = useState<StepData[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedFor = useRef<string | null>(null);
  const { theme } = useTheme();
  const isLight = theme === "lucid-light";

  useEffect(() => {
    const key = `${goal.id}::${period}`;
    if (fetchedFor.current === key) return;
    fetchedFor.current = key;
    setLoading(true);
    fetch(`/api/stats/charts?type=hours_by_step&goalId=${goal.id}&period=${period}`)
      .then((r) => r.json())
      .then((d) => setSteps(Array.isArray(d) ? d : []))
      .catch(() => setSteps([]))
      .finally(() => setLoading(false));
  }, [goal.id, period]);

  const totalHours = steps.reduce((sum, s) => sum + s.hours, 0);
  const activeSteps = steps.filter((s) => s.hours > 0);

  return (
    <div className="glass-card p-4 group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-primary group-hover:text-primary transition-colors flex items-center gap-2">
          <span className="text-base">{goal.emoji}</span>
          {goal.name}
        </h3>
        {!loading && totalHours > 0 && (
          <span className="text-xs text-secondary bg-surface-2 px-2 py-0.5 rounded-full tabular-nums">
            {formatHours(totalHours)} total
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-4 animate-pulse">
          <div className="w-20 h-20 rounded-full bg-surface-2 flex-shrink-0" />
          <div className="flex-1 space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-surface-2 flex-shrink-0" />
                <div className="h-3 bg-surface-2 rounded flex-1" />
              </div>
            ))}
          </div>
        </div>
      ) : steps.length === 0 ? (
        <p className="text-xs text-secondary">No activity logged in this period.</p>
      ) : (
        <div className="flex items-center gap-5">
          {/* Donut */}
          <DonutChart steps={activeSteps} totalHours={totalHours} />

          {/* Step list */}
          <ul className="flex-1 space-y-2 min-w-0">
            {steps.map((step, i) => (
              <li key={step.name} className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      step.hours > 0 ? COLOURS[i % COLOURS.length] : (isLight ? "#d1d5db" : "rgba(255,255,255,0.12)"),
                  }}
                />
                <span className="text-xs text-secondary truncate flex-1">{step.name}</span>
                <span
                  className="text-xs tabular-nums flex-shrink-0"
                  style={{ color: step.hours > 0 ? "var(--color-text-primary)" : "var(--color-text-secondary)", opacity: step.hours > 0 ? 1 : 0.4 }}
                >
                  {step.hours > 0 ? formatHours(step.hours) : "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function GoalBreakdownSection({ goals, period }: GoalBreakdownSectionProps) {
  if (goals.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Goal Breakdown
      </h2>
      <div className="space-y-3">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} period={period} />
        ))}
      </div>
    </div>
  );
}
