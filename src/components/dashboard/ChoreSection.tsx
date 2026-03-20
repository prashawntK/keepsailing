"use client";

import { useState } from "react";
import type { ChoreWithStatus } from "@/types";
import { getPersuasiveMessage } from "@/lib/chore-messages";

interface Props {
  chores: ChoreWithStatus[];
  onRefresh: () => void;
}

function timeLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// Raw CSS color values for use in inline styles
const SEVERITY_COLOR: Record<ChoreWithStatus["deadlineSeverity"], string> = {
  overdue:     "239,68,68",
  today:       "239,68,68",
  urgent:      "245,158,11",
  warning:     "234,179,8",
  comfortable: "56,189,248",
  relaxed:     "34,197,94",
};

const SEVERITY_TEXT: Record<ChoreWithStatus["deadlineSeverity"], string> = {
  overdue:     "text-error",
  today:       "text-error",
  urgent:      "text-streak",
  warning:     "text-warning",
  comfortable: "text-info",
  relaxed:     "text-success",
};

export function ChoreSection({ chores, onRefresh }: Props) {
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const visible = chores.filter((c) => !hidden[c.id]);

  const sorted = [...visible].sort((a, b) => {
    const aChecked = optimistic[a.id] ?? a.completedToday;
    const bChecked = optimistic[b.id] ?? b.completedToday;
    if (aChecked !== bChecked) return aChecked ? 1 : -1;
    return a.daysUntilDeadline - b.daysUntilDeadline;
  });

  function handleToggle(id: string, currentlyCompleted: boolean) {
    const newVal = !(optimistic[id] ?? currentlyCompleted);
    setOptimistic((prev) => ({ ...prev, [id]: newVal }));
    if (newVal) setHidden((prev) => ({ ...prev, [id]: true }));

    fetch("/api/chores/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
      .then(() => onRefresh())
      .catch(() => {
        setOptimistic((prev) => ({ ...prev, [id]: !newVal }));
        setHidden((prev) => ({ ...prev, [id]: false }));
      });
  }

  if (sorted.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold text-streak/70 uppercase tracking-wider">
        Chores
      </h2>

      <div className="space-y-2.5">
        {sorted.map((chore) => {
          const checked = optimistic[chore.id] ?? chore.completedToday;
          const isHovered = hoveredId === chore.id;
          const rgb = SEVERITY_COLOR[chore.deadlineSeverity];
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
              className="flex rounded-2xl overflow-hidden"
              style={{
                opacity: checked ? 0.45 : 1,
                transform: isHovered && !checked ? "translateY(-2px)" : "translateY(0)",
                transition: "opacity 0.2s, transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s",
                // Glass base
                background: "var(--glass-bg)",
                backdropFilter: "blur(var(--glass-blur))",
                WebkitBackdropFilter: "blur(var(--glass-blur))",
                // Severity-tinted top border acts as the shimmer highlight
                borderTop: `1px solid rgba(${rgb},${isHovered ? 0.55 : 0.3})`,
                borderLeft: `1px solid rgba(${rgb},${isHovered ? 0.3 : 0.15})`,
                borderRight: `1px solid rgba(${rgb},${isHovered ? 0.3 : 0.15})`,
                borderBottom: `1px solid rgba(${rgb},${isHovered ? 0.3 : 0.15})`,
                boxShadow: isHovered && !checked
                  ? `0 8px 32px -8px rgba(${rgb},0.35), inset 0 1px 0 rgba(${rgb},0.2), var(--glass-shadow)`
                  : `inset 0 1px 0 rgba(${rgb},0.1), var(--glass-shadow)`,
              }}
              onMouseEnter={() => setHoveredId(chore.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* ── Left panel ── */}
              <div className="flex-1 flex items-center gap-3 px-4 py-3.5 min-w-0">
                {/* Emoji with glassy pill */}
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{
                    background: `rgba(${rgb},0.12)`,
                    border: `1px solid rgba(${rgb},0.2)`,
                    boxShadow: `0 0 12px rgba(${rgb},0.1)`,
                  }}
                >
                  {chore.emoji}
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold leading-snug ${
                    checked ? "line-through text-gray-500" : "text-gray-100"
                  }`}>
                    {chore.name}
                  </p>
                  {!checked && message && (
                    <p className="text-[11px] text-gray-500 italic mt-0.5 leading-tight">
                      {message}
                    </p>
                  )}
                  {chore.totalMinutesSpent > 0 && (
                    <p className="text-[10px] text-gray-600 mt-1">
                      {timeLabel(chore.totalMinutesSpent)} spent
                    </p>
                  )}
                </div>
              </div>

              {/* Dashed divider */}
              <div
                className="w-px self-stretch my-2"
                style={{
                  background: `repeating-linear-gradient(
                    to bottom,
                    rgba(${rgb},0.35) 0px,
                    rgba(${rgb},0.35) 4px,
                    transparent 4px,
                    transparent 8px
                  )`,
                }}
              />

              {/* ── Right panel ── */}
              <div
                className="flex flex-col items-center justify-center gap-2.5 px-4 py-3.5 min-w-[88px]"
                style={{
                  background: `linear-gradient(160deg, rgba(${rgb},0.13) 0%, rgba(${rgb},0.06) 100%)`,
                }}
              >
                {/* Deadline label */}
                <p className={`text-[10px] font-bold uppercase tracking-widest text-center leading-tight ${
                  SEVERITY_TEXT[chore.deadlineSeverity]
                }`}
                  style={{ textShadow: `0 0 12px rgba(${rgb},0.5)` }}
                >
                  {chore.deadlineLabel}
                </p>

                {/* Circular checkbox */}
                <button
                  onClick={() => handleToggle(chore.id, chore.completedToday)}
                  className="flex items-center justify-center transition-all duration-150
                    active:scale-90"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: checked
                      ? "none"
                      : `2px solid rgba(${rgb},0.5)`,
                    background: checked
                      ? "var(--color-success)"
                      : `rgba(${rgb},0.08)`,
                    boxShadow: checked
                      ? "0 0 12px rgba(34,197,94,0.4)"
                      : `0 0 8px rgba(${rgb},0.15)`,
                    color: checked ? "white" : `rgba(${rgb},0.9)`,
                    transition: "all 0.15s cubic-bezier(0.34,1.56,0.64,1)",
                  }}
                  onMouseEnter={(e) => {
                    if (!checked) {
                      (e.currentTarget as HTMLElement).style.background = `rgba(${rgb},0.2)`;
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 0 14px rgba(${rgb},0.35)`;
                      (e.currentTarget as HTMLElement).style.borderColor = `rgba(${rgb},0.8)`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!checked) {
                      (e.currentTarget as HTMLElement).style.background = `rgba(${rgb},0.08)`;
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 0 8px rgba(${rgb},0.15)`;
                      (e.currentTarget as HTMLElement).style.borderColor = `rgba(${rgb},0.5)`;
                    }
                  }}
                >
                  {checked ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    // Empty circle hint
                    <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
