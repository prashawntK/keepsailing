"use client";

import { useState, useCallback } from "react";
import type { ExtraCurricularWithStatus } from "@/types";

interface Props {
  items: ExtraCurricularWithStatus[];
  onRefresh: () => void;
}

/* ── Staleness helpers ──────────────────────────────────────────────────── */

type StalenessLevel = "recharged" | "fresh" | "fading" | "stale" | "empty";

function getStaleness(item: ExtraCurricularWithStatus): StalenessLevel {
  if (item.completedToday) return "recharged";
  if (item.lastPerformedDaysAgo === null) return "empty";
  const d = item.lastPerformedDaysAgo;
  if (d <= 2) return "fresh";
  if (d <= 5) return "fading";
  return "stale";
}

/** Returns { boxShadow, borderColor, bgTint } for each staleness level */
function getOrbStyles(level: StalenessLevel, isHovered: boolean) {
  const intensity = isHovered ? 1.5 : 1;
  switch (level) {
    case "recharged":
      return {
        boxShadow: `0 0 ${16 * intensity}px ${6 * intensity}px rgba(34, 197, 94, 0.35),
                     inset 0 0 ${10 * intensity}px rgba(34, 197, 94, 0.15)`,
        borderColor: "rgba(34, 197, 94, 0.4)",
        bgTint: "rgba(34, 197, 94, 0.08)",
      };
    case "fresh":
      return {
        boxShadow: `0 0 ${10 * intensity}px ${3 * intensity}px rgba(34, 197, 94, 0.2),
                     inset 0 0 ${6 * intensity}px rgba(34, 197, 94, 0.08)`,
        borderColor: "rgba(34, 197, 94, 0.25)",
        bgTint: "rgba(34, 197, 94, 0.04)",
      };
    case "fading":
      return {
        boxShadow: `0 0 ${10 * intensity}px ${3 * intensity}px rgba(245, 158, 11, 0.25),
                     inset 0 0 ${6 * intensity}px rgba(245, 158, 11, 0.1)`,
        borderColor: "rgba(245, 158, 11, 0.3)",
        bgTint: "rgba(245, 158, 11, 0.05)",
      };
    case "stale":
      return {
        boxShadow: `0 0 ${8 * intensity}px ${2 * intensity}px rgba(239, 68, 68, 0.2),
                     inset 0 0 ${4 * intensity}px rgba(239, 68, 68, 0.08)`,
        borderColor: "rgba(239, 68, 68, 0.25)",
        bgTint: "rgba(239, 68, 68, 0.04)",
      };
    case "empty":
      return {
        boxShadow: isHovered
          ? "0 0 8px 2px rgba(148, 163, 184, 0.15), inset 0 0 4px rgba(148, 163, 184, 0.05)"
          : "none",
        borderColor: "rgba(148, 163, 184, 0.15)",
        bgTint: "transparent",
      };
  }
}

function staleLabel(item: ExtraCurricularWithStatus): string {
  if (item.completedToday) return "today";
  if (item.lastPerformedDaysAgo === null) return "never";
  const d = item.lastPerformedDaysAgo;
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}

function staleTooltip(item: ExtraCurricularWithStatus): string {
  if (item.completedToday) return "Done today \u2713";
  if (item.lastPerformedDaysAgo === null) return "Never done";
  const d = item.lastPerformedDaysAgo;
  if (d === 1) return "Done yesterday";
  return `${d} days ago`;
}

/* ── Component ──────────────────────────────────────────────────────────── */

export function ExtraCurricularSection({ items, onRefresh }: Props) {
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});
  const [recharging, setRecharging] = useState<Record<string, boolean>>({});
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Sort: unchecked first (by staleness desc), checked sink to bottom
  const sorted = [...items].sort((a, b) => {
    const aChecked = optimistic[a.id] ?? a.completedToday;
    const bChecked = optimistic[b.id] ?? b.completedToday;
    if (aChecked !== bChecked) return aChecked ? 1 : -1;
    const aStale = a.lastPerformedDaysAgo ?? Infinity;
    const bStale = b.lastPerformedDaysAgo ?? Infinity;
    if (aStale !== bStale) return bStale - aStale;
    return a.sortOrder - b.sortOrder;
  });

  const handleToggle = useCallback(
    (id: string, currentlyCompleted: boolean) => {
      const newVal = !(optimistic[id] ?? currentlyCompleted);
      setOptimistic((prev) => ({ ...prev, [id]: newVal }));

      // Trigger recharge animation
      if (newVal) {
        setRecharging((prev) => ({ ...prev, [id]: true }));
        setTimeout(() => setRecharging((prev) => ({ ...prev, [id]: false })), 500);
      }

      fetch("/api/extra-curriculars/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
        .then(() => onRefresh())
        .catch(() => setOptimistic((prev) => ({ ...prev, [id]: !newVal })));
    },
    [optimistic, onRefresh],
  );

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold text-xp/70 uppercase tracking-wider">
        Extra-Curriculars
      </h2>

      <div className="flex flex-wrap gap-5">
        {sorted.map((item) => {
          const checked = optimistic[item.id] ?? item.completedToday;
          const staleness = getStaleness(
            checked ? { ...item, completedToday: true } : item,
          );
          const isHovered = hoveredId === item.id;
          const isRecharging = recharging[item.id] ?? false;
          const orbStyle = getOrbStyles(staleness, isHovered);
          const tooltip = staleTooltip(item);

          return (
            <div
              key={item.id}
              className="flex flex-col items-center gap-1.5 relative group"
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Tooltip */}
              <div
                className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                  opacity-0 group-hover:opacity-100 transition-all duration-200
                  translate-y-1 group-hover:translate-y-0
                  z-20 whitespace-nowrap"
              >
                <div
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg
                    text-gray-200 border border-white/10
                    shadow-lg shadow-black/30"
                  style={{
                    background: "var(--glass-panel-bg)",
                    backdropFilter: "blur(var(--glass-p-blur))",
                    WebkitBackdropFilter: "blur(var(--glass-p-blur))",
                  }}
                >
                  {tooltip}
                </div>
                <div
                  className="w-2 h-2 mx-auto -mt-1 rotate-45 border-b border-r border-white/10"
                  style={{ background: "var(--glass-panel-bg)" }}
                />
              </div>

              {/* Orb */}
              <button
                onClick={() => handleToggle(item.id, item.completedToday)}
                className={`w-16 h-16 rounded-full relative flex items-center justify-center
                  cursor-pointer select-none transition-all duration-300 ease-out
                  ${staleness === "empty" ? "border-dashed border-2" : "border"}
                  ${isRecharging ? "orb-recharge" : ""}
                `}
                style={{
                  background: `linear-gradient(135deg, ${orbStyle.bgTint}, var(--glass-bg))`,
                  backdropFilter: "blur(var(--glass-blur))",
                  WebkitBackdropFilter: "blur(var(--glass-blur))",
                  borderColor: orbStyle.borderColor,
                  boxShadow: orbStyle.boxShadow,
                  transform: isHovered && !isRecharging ? "translateY(-3px)" : "translateY(0)",
                }}
              >
                {/* Emoji */}
                <span className="text-2xl leading-none">{item.emoji}</span>

                {/* Checkmark badge for completed */}
                {checked && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center
                      text-[10px] font-bold text-white border border-white/20"
                    style={{
                      background: "linear-gradient(135deg, #22C55E, #16A34A)",
                      boxShadow: "0 2px 8px rgba(34, 197, 94, 0.4)",
                    }}
                  >
                    \u2713
                  </span>
                )}
              </button>

              {/* Name */}
              <span
                className={`text-[11px] font-medium text-center max-w-[72px] truncate leading-tight
                  ${checked ? "text-gray-500" : "text-gray-300"}`}
              >
                {item.name}
              </span>

              {/* Staleness label */}
              <span
                className={`text-[10px] leading-none
                  ${staleness === "recharged" ? "text-success/80" :
                    staleness === "fresh" ? "text-success/60" :
                    staleness === "fading" ? "text-streak/70" :
                    staleness === "stale" ? "text-error/60" :
                    "text-gray-600"}`}
              >
                {staleLabel(item)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
