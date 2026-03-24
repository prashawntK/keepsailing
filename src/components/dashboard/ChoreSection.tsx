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

// Success green RGB
const SUCCESS_RGB = "34,197,94";

export function ChoreSection({ chores, onRefresh }: Props) {
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // Phase 1: green flash + emoji bounce
  const [completing, setCompleting] = useState<Set<string>>(new Set());
  // Phase 2: height + opacity collapse
  const [exiting, setExiting] = useState<Set<string>>(new Set());

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

    if (newVal) {
      // Phase 1: green flash (550ms)
      setCompleting((prev) => new Set([...prev, id]));

      setTimeout(() => {
        // Phase 2: collapse out (450ms)
        setCompleting((prev) => { const n = new Set(prev); n.delete(id); return n; });
        setExiting((prev) => new Set([...prev, id]));

        setTimeout(() => {
          // Done — remove from DOM
          setHidden((prev) => ({ ...prev, [id]: true }));
          setExiting((prev) => { const n = new Set(prev); n.delete(id); return n; });
        }, 450);
      }, 550);
    } else {
      // Uncompleting — just update optimistic, no animation
    }

    fetch("/api/chores/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
      .then(() => onRefresh())
      .catch(() => {
        setOptimistic((prev) => ({ ...prev, [id]: !newVal }));
        setHidden((prev) => ({ ...prev, [id]: false }));
        setCompleting((prev) => { const n = new Set(prev); n.delete(id); return n; });
        setExiting((prev) => { const n = new Set(prev); n.delete(id); return n; });
      });
  }

  if (sorted.length === 0) {
    return (
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-streak/70 uppercase tracking-wider">
          Chores
        </h2>
        <div
          className="rounded-2xl px-4 py-3.5 text-sm text-gray-500 italic"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(var(--glass-blur))",
            WebkitBackdropFilter: "blur(var(--glass-blur))",
            border: "1px solid rgba(34,197,94,0.12)",
          }}
        >
          No chores due — you&apos;re on top of it! 🧹
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold text-streak/70 uppercase tracking-wider">
        Chores
      </h2>

      <div>
        {sorted.map((chore) => {
          const checked = optimistic[chore.id] ?? chore.completedToday;
          const isHovered = hoveredId === chore.id;
          const isCompleting = completing.has(chore.id);
          const isExiting = exiting.has(chore.id);
          const rgb = isCompleting ? SUCCESS_RGB : SEVERITY_COLOR[chore.deadlineSeverity];

          const message = getPersuasiveMessage({
            daysUntilDeadline: chore.daysUntilDeadline,
            estimatedMinutes: chore.estimatedMinutes,
            totalMinutesSpent: chore.totalMinutesSpent,
            completedToday: checked,
            choreId: chore.id,
          });

          return (
            // Height-collapse wrapper
            <div
              key={chore.id}
              style={{
                maxHeight: isExiting ? 0 : 140,
                opacity: isExiting ? 0 : 1,
                marginBottom: isExiting ? 0 : 10,
                // padding gives the hover lift room so overflow:hidden doesn't clip it
                paddingTop: 4,
                paddingBottom: 4,
                overflow: "hidden",
                transition: isExiting
                  ? "max-height 0.45s ease-in, opacity 0.35s ease-in, margin-bottom 0.45s ease-in"
                  : "margin-bottom 0s",
              }}
            >
              {/* The card */}
              <div
                className="flex rounded-2xl overflow-hidden"
                style={{
                  transform: isCompleting
                    ? "scale(1.025)"
                    : isHovered && !checked
                    ? "translateY(-2px)"
                    : "translateY(0)",
                  transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s, border-color 0.25s, background 0.3s",
                  background: isCompleting
                    ? `rgba(${SUCCESS_RGB},0.12)`
                    : "var(--glass-bg)",
                  backdropFilter: "blur(var(--glass-blur))",
                  WebkitBackdropFilter: "blur(var(--glass-blur))",
                  borderTop:    `1px solid rgba(${rgb},${isCompleting ? 0.8 : isHovered ? 0.55 : 0.3})`,
                  borderLeft:   `1px solid rgba(${rgb},${isCompleting ? 0.5 : isHovered ? 0.3 : 0.15})`,
                  borderRight:  `1px solid rgba(${rgb},${isCompleting ? 0.5 : isHovered ? 0.3 : 0.15})`,
                  borderBottom: `1px solid rgba(${rgb},${isCompleting ? 0.5 : isHovered ? 0.3 : 0.15})`,
                  boxShadow: isCompleting
                    ? `0 0 0 2px rgba(${SUCCESS_RGB},0.4), 0 8px 40px rgba(${SUCCESS_RGB},0.35), inset 0 1px 0 rgba(${SUCCESS_RGB},0.3)`
                    : isHovered && !checked
                    ? `0 8px 32px -8px rgba(${rgb},0.35), inset 0 1px 0 rgba(${rgb},0.2), var(--glass-shadow)`
                    : `inset 0 1px 0 rgba(${rgb},0.1), var(--glass-shadow)`,
                }}
                onMouseEnter={() => !isCompleting && setHoveredId(chore.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* ── Left panel ── */}
                <div className="flex-1 flex items-center gap-3 px-4 py-3.5 min-w-0">
                  {/* Emoji pill — bounces on completion */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center
                      justify-center text-xl ${isCompleting ? "chore-emoji-bounce" : ""}`}
                    style={{
                      background: `rgba(${rgb},${isCompleting ? 0.2 : 0.12})`,
                      border: `1px solid rgba(${rgb},${isCompleting ? 0.4 : 0.2})`,
                      boxShadow: isCompleting
                        ? `0 0 20px rgba(${SUCCESS_RGB},0.4)`
                        : `0 0 12px rgba(${rgb},0.1)`,
                    }}
                  >
                    {chore.emoji}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold leading-snug transition-colors duration-300 ${
                      isCompleting ? "text-success" : checked ? "line-through text-gray-500" : "text-gray-100"
                    }`}>
                      {chore.name}
                    </p>
                    {!checked && !isCompleting && message && (
                      <p className="text-[11px] text-gray-500 italic mt-0.5 leading-tight">
                        {message}
                      </p>
                    )}
                    {isCompleting && (
                      <p className="text-[11px] text-success/80 mt-0.5 leading-tight font-medium">
                        Done! Great job 🎉
                      </p>
                    )}
                    {chore.totalMinutesSpent > 0 && !isCompleting && (
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
                      rgba(${rgb},${isCompleting ? 0.7 : 0.35}) 0px,
                      rgba(${rgb},${isCompleting ? 0.7 : 0.35}) 4px,
                      transparent 4px,
                      transparent 8px
                    )`,
                    transition: "background 0.3s",
                  }}
                />

                {/* ── Right panel ── */}
                <div
                  className="flex flex-col items-center justify-center gap-2.5 px-4 py-3.5 min-w-[88px]"
                  style={{
                    background: isCompleting
                      ? `linear-gradient(160deg, rgba(${SUCCESS_RGB},0.2) 0%, rgba(${SUCCESS_RGB},0.1) 100%)`
                      : `linear-gradient(160deg, rgba(${rgb},0.13) 0%, rgba(${rgb},0.06) 100%)`,
                    transition: "background 0.3s",
                  }}
                >
                  {/* Deadline / done label */}
                  <p
                    className={`text-[10px] font-bold uppercase tracking-widest text-center leading-tight transition-all duration-300 ${
                      isCompleting ? "text-success" : SEVERITY_TEXT[chore.deadlineSeverity]
                    }`}
                    style={{
                      textShadow: `0 0 12px rgba(${rgb},0.5)`,
                    }}
                  >
                    {isCompleting ? "Done!" : chore.deadlineLabel}
                  </p>

                  {/* Circular checkbox */}
                  <button
                    onClick={() => handleToggle(chore.id, chore.completedToday)}
                    disabled={isCompleting || isExiting}
                    className="flex items-center justify-center active:scale-90"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      border: isCompleting || checked ? "none" : `2px solid rgba(${rgb},0.5)`,
                      background: isCompleting || checked
                        ? "var(--color-success)"
                        : `rgba(${rgb},0.08)`,
                      boxShadow: isCompleting
                        ? `0 0 20px rgba(${SUCCESS_RGB},0.6), 0 0 40px rgba(${SUCCESS_RGB},0.2)`
                        : checked
                        ? "0 0 12px rgba(34,197,94,0.4)"
                        : `0 0 8px rgba(${rgb},0.15)`,
                      color: isCompleting || checked ? "white" : `rgba(${rgb},0.9)`,
                      transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                    }}
                    onMouseEnter={(e) => {
                      if (!checked && !isCompleting) {
                        (e.currentTarget as HTMLElement).style.background = `rgba(${rgb},0.2)`;
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 14px rgba(${rgb},0.35)`;
                        (e.currentTarget as HTMLElement).style.borderColor = `rgba(${rgb},0.8)`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!checked && !isCompleting) {
                        (e.currentTarget as HTMLElement).style.background = `rgba(${rgb},0.08)`;
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 8px rgba(${rgb},0.15)`;
                        (e.currentTarget as HTMLElement).style.borderColor = `rgba(${rgb},0.5)`;
                      }
                    }}
                  >
                    <svg
                      className={`w-4 h-4 ${isCompleting ? "chore-check-pop" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                      style={{ opacity: isCompleting || checked ? 1 : 0.4 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
