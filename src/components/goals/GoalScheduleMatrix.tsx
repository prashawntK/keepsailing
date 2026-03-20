"use client";

import { Fragment, useState, useCallback } from "react";
import { cn, parseActiveDays, formatHours } from "@/lib/utils";
import type { Goal } from "@/types";
import { useToast } from "@/lib/toast";

interface GoalScheduleMatrixProps {
  goals: Goal[];
  onRefresh: () => void;
}

const DAYS = [
  { idx: 0, label: "Sun" },
  { idx: 1, label: "Mon" },
  { idx: 2, label: "Tue" },
  { idx: 3, label: "Wed" },
  { idx: 4, label: "Thu" },
  { idx: 5, label: "Fri" },
  { idx: 6, label: "Sat" },
];

const PRIORITY_ORDER: Record<string, number> = { must: 0, should: 1, want: 2 };

const PRIORITY_META: Record<string, { accent: string; dot: string; label: string }> = {
  must:   { accent: "bg-red-500",   dot: "bg-red-500",   label: "Must Do"    },
  should: { accent: "bg-amber-500", dot: "bg-amber-500", label: "Should Do"  },
  want:   { accent: "bg-sky-500",   dot: "bg-sky-500",   label: "Want To Do" },
};

const TODAY_IDX = new Date().getDay();

export function GoalScheduleMatrix({ goals, onRefresh }: GoalScheduleMatrixProps) {
  const [localDays, setLocalDays] = useState<Record<string, number[]>>({});
  const { success: toastSuccess, error: toastError } = useToast();

  const sorted = [...goals].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 1;
    const pb = PRIORITY_ORDER[b.priority] ?? 1;
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name);
  });

  const getActiveDays = useCallback(
    (goal: Goal): number[] => localDays[goal.id] ?? parseActiveDays(goal.activeDays),
    [localDays]
  );

  async function toggleDay(goal: Goal, dayIdx: number) {
    const current = getActiveDays(goal);
    const next = current.includes(dayIdx)
      ? current.filter((d) => d !== dayIdx)
      : [...current, dayIdx].sort();

    setLocalDays((prev) => ({ ...prev, [goal.id]: next }));
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeDays: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setLocalDays((prev) => ({ ...prev, [goal.id]: current }));
      toastError("Failed to update schedule");
    }
  }

  async function applyPreset(goal: Goal, preset: "everyday" | "weekdays" | "weekends") {
    const presets: Record<string, number[]> = {
      everyday: [0, 1, 2, 3, 4, 5, 6],
      weekdays: [1, 2, 3, 4, 5],
      weekends: [0, 6],
    };
    const next = presets[preset];
    const current = getActiveDays(goal);
    setLocalDays((prev) => ({ ...prev, [goal.id]: next }));
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeDays: next }),
      });
      if (!res.ok) throw new Error();
      toastSuccess("Schedule updated", goal.name);
    } catch {
      setLocalDays((prev) => ({ ...prev, [goal.id]: current }));
      toastError("Failed to update schedule");
    }
  }

  if (goals.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-3xl mb-2">🎯</p>
        <p>No goals yet — add your first one!</p>
      </div>
    );
  }

  const groups = [
    { key: "must",   ...PRIORITY_META.must,   goals: sorted.filter((g) => g.priority === "must")   },
    { key: "should", ...PRIORITY_META.should, goals: sorted.filter((g) => g.priority === "should") },
    { key: "want",   ...PRIORITY_META.want,   goals: sorted.filter((g) => g.priority === "want")   },
  ].filter((g) => g.goals.length > 0);

  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px]">

          {/* ── Header ─────────────────────────────────────────────── */}
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="sticky left-0 z-10 text-left px-4 py-3.5 text-[11px] font-semibold text-gray-500 uppercase tracking-widest bg-surface-2/80 backdrop-blur-xl">
                Goal
              </th>
              {DAYS.map((day) => {
                const isToday = day.idx === TODAY_IDX;
                const isWeekend = day.idx === 0 || day.idx === 6;
                return (
                  <th key={day.idx} className={cn(
                    "px-2 py-3.5 w-12 text-center",
                    isWeekend ? "text-gray-600" : isToday ? "text-primary" : "text-gray-500"
                  )}>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider">
                        {day.label}
                      </span>
                      {isToday && (
                        <span className="w-1 h-1 rounded-full bg-primary" />
                      )}
                    </div>
                  </th>
                );
              })}
              <th className="px-3 py-3.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-widest w-16 whitespace-nowrap">
                /wk
              </th>
            </tr>
          </thead>

          {/* ── Body ───────────────────────────────────────────────── */}
          <tbody>
            {groups.map((group) => (
              <Fragment key={group.key}>
                {/* Priority section divider */}
                <tr>
                  <td colSpan={9} className="px-4 pt-4 pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", group.dot)} />
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                        {group.label}
                      </span>
                      <div className="flex-1 h-px bg-white/[0.04]" />
                    </div>
                  </td>
                </tr>

                {group.goals.map((goal) => {
                  const activeDays = getActiveDays(goal);
                  const activeCount = activeDays.length;
                  return (
                    <GoalRow
                      key={goal.id}
                      goal={goal}
                      activeDays={activeDays}
                      activeCount={activeCount}
                      priorityAccent={group.accent}
                      onToggleDay={(dayIdx) => toggleDay(goal, dayIdx)}
                      onApplyPreset={(preset) => applyPreset(goal, preset)}
                    />
                  );
                })}
              </Fragment>
            ))}
            {/* ── Footer: per-day totals ──────────────────────────── */}
            <tr className="border-t border-white/[0.06]">
              <td className="sticky left-0 z-10 px-4 py-2.5 bg-surface-2/80 backdrop-blur-xl">
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Total</p>
              </td>
              {DAYS.map((day) => {
                const dayGoals = sorted.filter((g) => getActiveDays(g).includes(day.idx));
                const count = dayGoals.length;
                const hours = dayGoals.reduce((sum, g) => sum + (g.dailyTarget ?? 0), 0);
                const isToday  = day.idx === TODAY_IDX;
                const isWeekend = day.idx === 0 || day.idx === 6;
                return (
                  <td
                    key={day.idx}
                    className={cn(
                      "text-center px-1 py-2.5",
                      isWeekend && "bg-white/[0.012]",
                      isToday   && "bg-primary/[0.04]"
                    )}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={cn(
                        "text-xs font-semibold",
                        count > 0 ? "text-primary" : "text-gray-700"
                      )}>
                        {count}
                      </span>
                      {hours > 0 && (
                        <span className="text-[9px] text-gray-600 leading-none">
                          {formatHours(hours)}
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
              <td className="px-3 py-2.5 text-right">
                {(() => {
                  const grandTotal = sorted.reduce((sum, g) => {
                    const count = getActiveDays(g).length;
                    return sum + (g.dailyTarget ?? 0) * count;
                  }, 0);
                  return grandTotal > 0 ? (
                    <span className="text-xs font-bold text-primary">{formatHours(grandTotal)}</span>
                  ) : null;
                })()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Individual goal row ──────────────────────────────────────────────── */

function GoalRow({
  goal,
  activeDays,
  activeCount,
  priorityAccent,
  onToggleDay,
  onApplyPreset,
}: {
  goal: Goal;
  activeDays: number[];
  activeCount: number;
  priorityAccent: string;
  onToggleDay: (dayIdx: number) => void;
  onApplyPreset: (preset: "everyday" | "weekdays" | "weekends") => void;
}) {
  const [showPresets, setShowPresets] = useState(false);

  const scheduleLabel =
    activeCount === 7
      ? "Every day"
      : activeCount === 5 && [1, 2, 3, 4, 5].every((d) => activeDays.includes(d))
      ? "Weekdays"
      : activeCount === 2 && [0, 6].every((d) => activeDays.includes(d))
      ? "Weekends"
      : activeCount === 0
      ? "No days"
      : `${activeCount}×/week`;

  return (
    <tr className="group border-b border-white/[0.03] transition-colors duration-150 hover:bg-white/[0.03]">

      {/* Goal name — sticky */}
      <td className="px-4 py-3 sticky left-0 z-10 transition-colors duration-150 bg-surface-2/80 backdrop-blur-xl group-hover:bg-surface-3/80">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn("w-[3px] h-7 rounded-full flex-shrink-0", priorityAccent)} />
          <span className="text-base flex-shrink-0 leading-none">{goal.emoji}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary truncate max-w-[130px] sm:max-w-[190px]">
              {goal.name}
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5 flex items-center gap-1.5">
              <span>{scheduleLabel}</span>
              {goal.dailyTarget > 0 && (
                <span className="text-gray-500/50">· {formatHours(goal.dailyTarget)}</span>
              )}
            </p>
          </div>
        </div>
      </td>

      {/* Day dots */}
      {DAYS.map((day) => {
        const isActive = activeDays.includes(day.idx);
        const isToday  = day.idx === TODAY_IDX;
        const isWeekend = day.idx === 0 || day.idx === 6;

        return (
          <td
            key={day.idx}
            className={cn(
              "text-center px-1 py-3",
              isWeekend && "bg-white/[0.012]",
              isToday   && "bg-primary/[0.04]"
            )}
          >
            <button
              onClick={() => onToggleDay(day.idx)}
              title={`${isActive ? "Remove" : "Add"} ${goal.name} on ${day.label}`}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center mx-auto",
                "transition-all duration-100 active:scale-90",
                isActive
                  ? "bg-primary/[0.15] hover:bg-primary/[0.25] shadow-sm"
                  : "hover:bg-white/[0.06]"
              )}
            >
              {isActive ? (
                <span
                  className="w-3 h-3 rounded-full bg-primary transition-all duration-100"
                  style={{ boxShadow: "0 0 8px rgba(139,92,246,0.55)" }}
                />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full border border-white/[0.12] group-hover:border-white/20 transition-all duration-100" />
              )}
            </button>
          </td>
        );
      })}

      {/* Weekly total + preset ⋮ menu */}
      <td className="px-3 py-3 relative text-right">
        {goal.dailyTarget > 0 && activeCount > 0 && (
          <span className="text-[11px] font-medium text-gray-600/60 group-hover:opacity-0 transition-opacity duration-150">
            {formatHours(goal.dailyTarget * activeCount)}
          </span>
        )}
        <button
          onClick={() => setShowPresets(!showPresets)}
          title="Quick presets"
          className="w-6 h-6 absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-lg text-gray-700 hover:text-gray-400 hover:bg-white/[0.06] opacity-0 group-hover:opacity-100 transition-all duration-150"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5"  r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>

        {showPresets && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowPresets(false)} />
            <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[130px] overflow-hidden rounded-xl border border-white/[0.08] shadow-2xl"
              style={{ background: "rgba(20,20,35,0.92)", backdropFilter: "blur(24px)" }}
            >
              {(["everyday", "weekdays", "weekends"] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => { onApplyPreset(preset); setShowPresets(false); }}
                  className="w-full px-3.5 py-2 text-left text-xs text-gray-400 hover:text-primary hover:bg-white/[0.05] capitalize transition-colors duration-100 first:pt-2.5 last:pb-2.5"
                >
                  {preset}
                </button>
              ))}
            </div>
          </>
        )}
      </td>
    </tr>
  );
}
