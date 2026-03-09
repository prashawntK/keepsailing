"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Maximize2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

interface DayScore {
  date: string;
  goalsCompleted: number;
  goalsTotal: number;
}

interface LifeInWeeksCardProps {
  scores: DayScore[];
  year: number;
}

type WeekStatus = "green" | "red" | "amber" | "future";

interface Week {
  weekNum: number;
  start: string; // "YYYY-MM-DD"
  end: string;   // "YYYY-MM-DD"
}

// ─── helpers ────────────────────────────────────────────────────────────────

function getWeeksOfYear(year: number): Week[] {
  const weeks: Week[] = [];
  const yearEnd = new Date(year, 11, 31);
  const cursor = new Date(year, 0, 1);

  while (cursor <= yearEnd) {
    const start = format(new Date(cursor), "yyyy-MM-dd");
    const endDate = new Date(cursor);
    endDate.setDate(endDate.getDate() + 6);
    const end = format(endDate > yearEnd ? yearEnd : endDate, "yyyy-MM-dd");
    weeks.push({ weekNum: weeks.length + 1, start, end });
    cursor.setDate(cursor.getDate() + 7);
  }

  return weeks;
}

function getWeekStatus(
  week: Week,
  scores: DayScore[],
  today: string
): { status: WeekStatus; rate: number; completed: number; total: number } {
  if (week.start > today) return { status: "future", rate: 0, completed: 0, total: 0 };

  const days = scores.filter(
    (s) => s.date >= week.start && s.date <= week.end && s.goalsTotal > 0
  );

  if (days.length === 0) {
    return {
      status: week.end < today ? "red" : "amber",
      rate: 0,
      completed: 0,
      total: 0,
    };
  }

  const completed = days.reduce((s, d) => s + d.goalsCompleted, 0);
  const total = days.reduce((s, d) => s + d.goalsTotal, 0);
  const rate = total > 0 ? completed / total : 0;
  const isCurrent = week.start <= today && week.end >= today;

  const status: WeekStatus =
    isCurrent
      ? rate >= 0.51
        ? "green"
        : "amber"
      : rate >= 0.51
      ? "green"
      : "red";

  return { status, rate, completed, total };
}

function formatWeekLabel(week: Week): string {
  const start = new Date(week.start + "T00:00:00");
  const end = new Date(week.end + "T00:00:00");
  return `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
}

// ─── box colours ────────────────────────────────────────────────────────────

function boxClasses(status: WeekStatus): string {
  switch (status) {
    case "green":
      return "bg-success/80 hover:bg-success";
    case "red":
      return "bg-error/70 hover:bg-error/90";
    case "amber":
      return "bg-streak/70 hover:bg-streak/90";
    case "future":
    default:
      return "bg-surface-3 opacity-40";
  }
}

// ─── grid sub-component ──────────────────────────────────────────────────────

interface WeekGridProps {
  weeks: Week[];
  scores: DayScore[];
  today: string;
  boxSize: "sm" | "lg";
}

function WeekGrid({ weeks, scores, today, boxSize }: WeekGridProps) {
  const quarters = [
    { label: "Q1", weeks: weeks.slice(0, 13) },
    { label: "Q2", weeks: weeks.slice(13, 26) },
    { label: "Q3", weeks: weeks.slice(26, 39) },
    { label: "Q4", weeks: weeks.slice(39) },
  ];

  const sizeClass = boxSize === "sm" ? "w-[10px] h-[10px]" : "w-5 h-5";
  const gapClass  = boxSize === "sm" ? "gap-[3px]" : "gap-1";

  return (
    <div className="space-y-2">
      {quarters.map(({ label, weeks: qWeeks }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-5 flex-shrink-0 font-medium">{label}</span>
          <div className={cn("flex flex-wrap", gapClass)}>
            {qWeeks.map((week) => {
              const { status, rate, completed, total } = getWeekStatus(week, scores, today);
              const pct = Math.round(rate * 100);
              const tooltip =
                status === "future"
                  ? `Week ${week.weekNum} (${formatWeekLabel(week)}): upcoming`
                  : total === 0
                  ? `Week ${week.weekNum} (${formatWeekLabel(week)}): no data`
                  : `Week ${week.weekNum} (${formatWeekLabel(week)}): ${completed}/${total} goals (${pct}%)`;

              return (
                <div
                  key={week.weekNum}
                  title={tooltip}
                  className={cn(
                    sizeClass,
                    "rounded-[2px] transition-all duration-150 cursor-default",
                    boxClasses(status),
                    // ring on current week
                    week.start <= today && week.end >= today &&
                      "ring-1 ring-white/40 ring-offset-[1px] ring-offset-surface-1"
                  )}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── legend ──────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex items-center gap-4 mt-3 flex-wrap">
      {[
        { cls: "bg-success/80", label: "≥51% done" },
        { cls: "bg-streak/70",  label: "In progress" },
        { cls: "bg-error/70",   label: "Missed" },
        { cls: "bg-surface-3 opacity-40", label: "Upcoming" },
      ].map(({ cls, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <div className={cn("w-3 h-3 rounded-[2px]", cls)} />
          <span className="text-xs text-gray-500">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── main card ───────────────────────────────────────────────────────────────

export function LifeInWeeksCard({ scores, year }: LifeInWeeksCardProps) {
  const [expanded, setExpanded] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");
  const weeks = getWeeksOfYear(year);

  const greenCount = weeks.filter(
    (w) => getWeekStatus(w, scores, today).status === "green"
  ).length;

  const totalPast = weeks.filter((w) => w.end <= today).length;

  return (
    <>
      <div className="card p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Your Life in Weeks — {year}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {greenCount} / {totalPast} weeks on track
            </p>
          </div>
          <button
            onClick={() => setExpanded(true)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-surface-2 transition-colors"
            title="Maximize"
          >
            <Maximize2 size={14} />
          </button>
        </div>

        {/* Compact grid */}
        <WeekGrid weeks={weeks} scores={scores} today={today} boxSize="sm" />
        <Legend />
      </div>

      {/* Expanded modal */}
      <Modal
        open={expanded}
        onClose={() => setExpanded(false)}
        title={`Your Life in Weeks — ${year}`}
        className="max-w-2xl"
      >
        <div className="pt-1">
          <p className="text-xs text-gray-500 mb-4">
            {greenCount} / {totalPast} weeks on track this year
          </p>
          <WeekGrid weeks={weeks} scores={scores} today={today} boxSize="lg" />
          <Legend />
        </div>
      </Modal>
    </>
  );
}
