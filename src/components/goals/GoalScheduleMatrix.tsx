"use client";

import { Fragment, useState, useCallback } from "react";
import { cn, parseActiveDays, PRIORITY_LABELS } from "@/lib/utils";
import type { Goal } from "@/types";
import { useToast } from "@/lib/toast";

interface GoalScheduleMatrixProps {
  goals: Goal[];
  onRefresh: () => void;
}

const DAYS = [
  { idx: 1, label: "Mon", short: "M" },
  { idx: 2, label: "Tue", short: "T" },
  { idx: 3, label: "Wed", short: "W" },
  { idx: 4, label: "Thu", short: "T" },
  { idx: 5, label: "Fri", short: "F" },
  { idx: 6, label: "Sat", short: "S" },
  { idx: 0, label: "Sun", short: "S" },
];

const PRIORITY_ORDER: Record<string, number> = { must: 0, should: 1, want: 2 };

const PRIORITY_ACCENT: Record<string, string> = {
  must: "bg-red-500",
  should: "bg-amber-500",
  want: "bg-sky-500",
};

export function GoalScheduleMatrix({ goals, onRefresh }: GoalScheduleMatrixProps) {
  // Local optimistic state: goalId → activeDays
  const [localDays, setLocalDays] = useState<Record<string, number[]>>({});
  const { success: toastSuccess, error: toastError } = useToast();

  const sorted = [...goals].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 1;
    const pb = PRIORITY_ORDER[b.priority] ?? 1;
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name);
  });

  const getActiveDays = useCallback(
    (goal: Goal): number[] => {
      return localDays[goal.id] ?? parseActiveDays(goal.activeDays);
    },
    [localDays]
  );

  async function toggleDay(goal: Goal, dayIdx: number) {
    const current = getActiveDays(goal);
    const next = current.includes(dayIdx)
      ? current.filter((d) => d !== dayIdx)
      : [...current, dayIdx].sort();

    // Optimistic update
    setLocalDays((prev) => ({ ...prev, [goal.id]: next }));

    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeDays: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Rollback
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
      toastSuccess("Schedule updated", `${goal.name} → ${preset}`);
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

  // Group by priority
  const groups = [
    { key: "must", label: "Must Do", goals: sorted.filter((g) => g.priority === "must") },
    { key: "should", label: "Should Do", goals: sorted.filter((g) => g.priority === "should") },
    { key: "want", label: "Want To Do", goals: sorted.filter((g) => g.priority === "want") },
  ].filter((g) => g.goals.length > 0);

  return (
    <div className="glass-card overflow-hidden">
      {/* Scrollable wrapper for mobile */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px]">
          {/* Header */}
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-4 py-3 text-xs font-medium text-secondary uppercase tracking-wider sticky left-0 bg-surface-1 z-10">
                Goal
              </th>
              {DAYS.map((day) => (
                <th
                  key={day.idx}
                  className={cn(
                    "px-2 py-3 text-xs font-medium uppercase tracking-wider text-center w-12",
                    day.idx === 0 || day.idx === 6 ? "text-gray-600" : "text-secondary"
                  )}
                >
                  <span className="hidden sm:inline">{day.label}</span>
                  <span className="sm:hidden">{day.short}</span>
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <Fragment key={group.key}>
                {/* Priority group header */}
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600"
                  >
                    {group.label}
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
                      priorityAccent={PRIORITY_ACCENT[goal.priority] ?? "bg-gray-500"}
                      onToggleDay={(dayIdx) => toggleDay(goal, dayIdx)}
                      onApplyPreset={(preset) => applyPreset(goal, preset)}
                    />
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/5 text-[10px] text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" /> Must Do
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> Should Do
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-500" /> Want To Do
        </span>
        <span className="ml-auto text-gray-700">Click dots to toggle</span>
      </div>
    </div>
  );
}

/* ── Individual goal row ─────────────────────────────────────────────── */

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

  return (
    <tr className="group border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
      {/* Goal name cell */}
      <td className="px-4 py-2.5 sticky left-0 bg-surface-1 group-hover:bg-white/[0.02] z-10 transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn("w-0.5 h-6 rounded-full flex-shrink-0", priorityAccent)} />
          <span className="text-lg flex-shrink-0">{goal.emoji}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary truncate max-w-[140px] sm:max-w-[200px]">
              {goal.name}
            </p>
            <p className="text-[10px] text-gray-600">
              {activeCount === 7
                ? "Everyday"
                : activeCount === 5 && [1, 2, 3, 4, 5].every((d) => activeDays.includes(d))
                ? "Weekdays"
                : activeCount === 2 && [0, 6].every((d) => activeDays.includes(d))
                ? "Weekends"
                : `${activeCount} days/week`}
            </p>
          </div>
        </div>
      </td>

      {/* Day dots */}
      {DAYS.map((day) => {
        const isActive = activeDays.includes(day.idx);
        return (
          <td key={day.idx} className="text-center px-2 py-2.5">
            <button
              onClick={() => onToggleDay(day.idx)}
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center mx-auto transition-all duration-150",
                isActive
                  ? "bg-primary/20 hover:bg-primary/30"
                  : "hover:bg-white/5"
              )}
              title={`${isActive ? "Remove" : "Add"} ${goal.name} on ${day.label}`}
            >
              <span
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-150",
                  isActive
                    ? "bg-primary scale-100"
                    : "bg-white/10 scale-75 group-hover:bg-white/20 group-hover:scale-90"
                )}
              />
            </button>
          </td>
        );
      })}

      {/* Presets menu */}
      <td className="px-1 py-2.5 relative">
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="p-1 rounded-lg text-gray-700 hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Quick presets"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
        {showPresets && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setShowPresets(false)} />
            <div className="absolute right-0 top-full mt-1 z-50 glass-card rounded-xl shadow-2xl py-1 min-w-[120px]">
              {(["everyday", "weekdays", "weekends"] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    onApplyPreset(preset);
                    setShowPresets(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-secondary hover:text-primary hover:bg-white/5 capitalize transition-colors"
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
