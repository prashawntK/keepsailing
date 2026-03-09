"use client";

import { getLast365Days, formatDateDisplay } from "@/lib/utils";
import { useTheme } from "@/components/providers/ThemeProvider";

interface StreakCalendarProps {
  scores: Array<{ date: string; score: number }>;
}

function getColor(score: number, isLight: boolean): string {
  if (isLight) {
    if (score === 0) return "#E2E8F0";           // slate-200  — empty, clearly visible
    if (score < 30)  return "#FCA5A5";           // red-300    — low activity
    if (score < 50)  return "#FCD34D";           // amber-300  — partial
    if (score < 70)  return "#86EFAC";           // green-300  — decent
    if (score < 85)  return "#4ADE80";           // green-400  — good
    return "#22C55E";                            // green-500  — excellent
  }
  // Dark themes — semantic colours using CSS variables where possible
  if (score === 0) return "rgba(255,255,255,0.09)"; // ghost square — clearly a cell
  if (score < 30)  return "rgba(239,68,68,0.45)";   // var(--color-error) faint
  if (score < 50)  return "rgba(245,158,11,0.55)";  // var(--color-streak) medium
  if (score < 70)  return "rgba(34,197,94,0.55)";   // var(--color-success) medium
  if (score < 85)  return "#16a34a";                // solid green
  return "#22C55E";                                  // bright success
}

export function StreakCalendar({ scores }: StreakCalendarProps) {
  const { theme } = useTheme();
  const isLight = theme === "lucid-light";
  const days = getLast365Days();
  const scoreMap = new Map(scores.map((s) => [s.date, s.score]));

  // Group into weeks (columns)
  const weeks: string[][] = [];
  let week: string[] = [];

  // Pad the start of the first week
  const firstDay = new Date(days[0] + "T00:00:00").getDay();
  for (let i = 0; i < firstDay; i++) week.push("");

  for (const day of days) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push("");
    weeks.push(week);
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1" style={{ minWidth: weeks.length * 14 }}>
        {weeks.map((w, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {w.map((day, di) => {
              if (!day) return <div key={di} className="w-3 h-3" />;
              const score = scoreMap.get(day) ?? 0;
              return (
                <div
                  key={day}
                  title={`${formatDateDisplay(day)}: ${Math.round(score)}`}
                  className="w-3 h-3 rounded-sm transition-all hover:scale-125 cursor-default"
                  style={{ backgroundColor: getColor(score, isLight) }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        {[
          { score: 0,  label: "None"  },
          { score: 20, label: "<30"   },
          { score: 40, label: "30–50" },
          { score: 60, label: "50–70" },
          { score: 75, label: "70–85" },
          { score: 90, label: "85+"   },
        ].map(({ score, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: getColor(score, isLight) }}
            />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
