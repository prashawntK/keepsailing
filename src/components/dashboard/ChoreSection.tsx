"use client";

import { useState } from "react";
import type { ChoreWithStatus } from "@/types";
import { getPersuasiveMessage } from "@/lib/chore-messages";

interface Props {
  chores: ChoreWithStatus[];
  onRefresh: () => void;
}

function timeLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const SEVERITY_COLORS: Record<ChoreWithStatus["deadlineSeverity"], string> = {
  overdue: "text-error bg-error/10 border-error/30",
  today: "text-error bg-error/10 border-error/30",
  urgent: "text-streak bg-streak/10 border-streak/30",
  warning: "text-warning bg-warning/10 border-warning/30",
  comfortable: "text-info bg-info/10 border-info/30",
  relaxed: "text-success bg-success/10 border-success/30",
};

export function ChoreSection({ chores, onRefresh }: Props) {
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});
  // Chores hidden optimistically after completion (archived → removed from list)
  const [hidden, setHidden] = useState<Record<string, boolean>>({});

  // Only show chores that haven't been optimistically hidden
  const visible = chores.filter((c) => !hidden[c.id]);

  // Sort: uncompleted by deadline urgency first, completed at bottom
  const sorted = [...visible].sort((a, b) => {
    const aChecked = optimistic[a.id] ?? a.completedToday;
    const bChecked = optimistic[b.id] ?? b.completedToday;
    if (aChecked !== bChecked) return aChecked ? 1 : -1;
    return a.daysUntilDeadline - b.daysUntilDeadline;
  });

  function handleToggle(id: string, currentlyCompleted: boolean) {
    const newVal = !(optimistic[id] ?? currentlyCompleted);
    setOptimistic((prev) => ({ ...prev, [id]: newVal }));

    // Hide immediately when completing — completing archives the chore
    if (newVal) setHidden((prev) => ({ ...prev, [id]: true }));

    fetch("/api/chores/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
      .then(() => onRefresh())
      .catch(() => {
        // Revert on error
        setOptimistic((prev) => ({ ...prev, [id]: !newVal }));
        setHidden((prev) => ({ ...prev, [id]: false }));
      });
  }

  if (sorted.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Chores
      </h2>

      <div className="glass-card divide-y divide-white/[0.06]">
        {sorted.map((chore) => {
          const checked = optimistic[chore.id] ?? chore.completedToday;
          const message = getPersuasiveMessage({
            daysUntilDeadline: chore.daysUntilDeadline,
            estimatedMinutes: chore.estimatedMinutes,
            totalMinutesSpent: chore.totalMinutesSpent,
            completedToday: checked,
            choreId: chore.id,
          });

          return (
            <div
              key={chore.id}
              className="px-4 py-3 transition-opacity"
              style={{ opacity: checked ? 0.6 : 1 }}
            >
              <div className="flex items-center gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => handleToggle(chore.id, chore.completedToday)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    checked
                      ? "bg-success border-success text-white"
                      : "border-gray-500 hover:border-gray-300"
                  }`}
                >
                  {checked && (
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>

                {/* Emoji */}
                <span className="text-base">{chore.emoji}</span>

                {/* Name + deadline badge + persuasive message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        checked
                          ? "line-through text-gray-500"
                          : "text-gray-200"
                      }`}
                    >
                      {chore.name}
                    </span>
                    {!checked && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border whitespace-nowrap ${
                          SEVERITY_COLORS[chore.deadlineSeverity]
                        }`}
                      >
                        {chore.deadlineLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 italic mt-0.5 truncate">
                    {message}
                  </p>
                </div>

                {/* Time spent */}
                {chore.totalMinutesSpent > 0 && (
                  <span className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">
                    {timeLabel(chore.totalMinutesSpent)} spent
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
