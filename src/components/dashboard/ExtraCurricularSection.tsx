"use client";

import { useState } from "react";
import type { ExtraCurricularWithStatus } from "@/types";

interface Props {
  items: ExtraCurricularWithStatus[];
  onRefresh: () => void;
}

function staleDotColor(item: ExtraCurricularWithStatus): string {
  if (item.completedToday) return "bg-success";
  if (item.lastPerformedDaysAgo === null) return "bg-error";
  const d = item.lastPerformedDaysAgo;
  if (d <= 2) return "bg-success";
  if (d <= 5) return "bg-streak";
  return "bg-error";
}

function staleTooltip(item: ExtraCurricularWithStatus): string {
  if (item.completedToday) return "Done today ✓";
  if (item.lastPerformedDaysAgo === null) return "Never done";
  const d = item.lastPerformedDaysAgo;
  if (d === 1) return "Done yesterday";
  return `${d} days ago`;
}

export function ExtraCurricularSection({ items, onRefresh }: Props) {
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});

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

  function handleToggle(id: string, currentlyCompleted: boolean) {
    const newVal = !(optimistic[id] ?? currentlyCompleted);
    setOptimistic((prev) => ({ ...prev, [id]: newVal }));

    fetch("/api/extra-curriculars/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
      .then(() => onRefresh())
      .catch(() => setOptimistic((prev) => ({ ...prev, [id]: !newVal })));
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold text-xp/70 uppercase tracking-wider">
        Extra-Curriculars
      </h2>

      <div className="flex flex-wrap gap-2">
        {sorted.map((item) => {
          const checked = optimistic[item.id] ?? item.completedToday;
          const tooltip = staleTooltip(item);
          return (
            <div key={item.id} className="relative group">
              {/* Hover tooltip */}
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
                {/* Arrow */}
                <div className="w-2 h-2 mx-auto -mt-1 rotate-45 border-b border-r border-white/10"
                  style={{ background: "var(--glass-panel-bg)" }}
                />
              </div>

              {/* Pill button */}
              <button
                onClick={() => handleToggle(item.id, item.completedToday)}
                className={`rounded-full px-3 py-1.5 border transition-all duration-200
                  cursor-pointer select-none inline-flex items-center gap-1.5 text-sm
                  ${checked
                    ? "border-xp/30 opacity-70"
                    : "hover:border-white/20 hover:-translate-y-0.5"
                  }`}
                style={checked ? {
                  background: "color-mix(in srgb, var(--color-xp) 12%, var(--glass-bg))",
                  backdropFilter: "blur(var(--glass-blur))",
                  WebkitBackdropFilter: "blur(var(--glass-blur))",
                  boxShadow: "inset 0 1px 0 rgba(167,139,250,0.15)",
                } : {
                  background: "var(--glass-bg)",
                  backdropFilter: "blur(var(--glass-blur))",
                  WebkitBackdropFilter: "blur(var(--glass-blur))",
                  border: "1px solid var(--glass-border)",
                  borderTop: "1px solid var(--glass-border-top)",
                  boxShadow: "var(--glass-shadow)",
                }}
              >
                <span className="text-base leading-none">{item.emoji}</span>
                <span
                  className={`font-medium ${
                    checked ? "line-through text-gray-500" : "text-gray-200"
                  }`}
                >
                  {item.name}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${staleDotColor(item)}`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
