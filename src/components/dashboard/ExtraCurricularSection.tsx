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

/** Returns subtle 3D glass orb styles for each staleness level */
function getOrbStyles(level: StalenessLevel, isHovered: boolean) {
  const h = isHovered;
  const base3d = `inset 0 1px 1px rgba(255,255,255,0.12), inset 0 -1px 3px rgba(0,0,0,0.2), 0 4px 10px rgba(0,0,0,0.25)`;
  switch (level) {
    case "recharged":
      return {
        background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.22) 0%, transparent 50%), radial-gradient(circle at 60% 70%, rgba(34,197,94,0.22) 0%, transparent 60%), var(--glass-bg)`,
        boxShadow: `0 0 ${h ? 28 : 20}px ${h ? 10 : 7}px rgba(34,197,94,0.5), ${base3d}`,
        borderColor: "rgba(34,197,94,0.7)",
        bgTint: "rgba(34,197,94,0.12)",
      };
    case "fresh":
      return {
        background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.12) 0%, transparent 50%), var(--glass-bg)`,
        boxShadow: `0 0 ${h ? 12 : 8}px ${h ? 4 : 2}px rgba(34,197,94,0.18), ${base3d}`,
        borderColor: "rgba(34,197,94,0.25)",
        bgTint: "rgba(34,197,94,0.04)",
      };
    case "fading":
      return {
        background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.12) 0%, transparent 50%), var(--glass-bg)`,
        boxShadow: `0 0 ${h ? 12 : 8}px ${h ? 4 : 2}px rgba(245,158,11,0.22), ${base3d}`,
        borderColor: "rgba(245,158,11,0.28)",
        bgTint: "rgba(245,158,11,0.05)",
      };
    case "stale":
      return {
        background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.1) 0%, transparent 50%), var(--glass-bg)`,
        boxShadow: `0 0 ${h ? 10 : 6}px ${h ? 3 : 2}px rgba(239,68,68,0.18), ${base3d}`,
        borderColor: "rgba(239,68,68,0.22)",
        bgTint: "rgba(239,68,68,0.04)",
      };
    case "empty":
      return {
        background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.08) 0%, transparent 50%), var(--glass-bg)`,
        boxShadow: `inset 0 1px 1px rgba(255,255,255,0.08), inset 0 -1px 3px rgba(0,0,0,0.15), 0 3px 8px rgba(0,0,0,0.2)`,
        borderColor: "rgba(148,163,184,0.15)",
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

  if (sorted.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-xp/70 uppercase tracking-wider">
          Extra-Curriculars
        </h2>
        <div
          className="rounded-2xl px-4 py-3.5 text-sm text-gray-500 italic"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(var(--glass-blur))",
            WebkitBackdropFilter: "blur(var(--glass-blur))",
            border: "1px solid rgba(148,163,184,0.12)",
          }}
        >
          No activities tracked yet — add some in Goals ✨
        </div>
      </div>
    );
  }

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
                className="pointer-events-none absolute bottom-full left-0 mb-2
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
                  {item.name}
                </div>
              </div>

              {/* Halo ring for completed orbs */}
              {checked && !isRecharging && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full pointer-events-none"
                  style={{
                    boxShadow: "0 0 0 2.5px rgba(34,197,94,0.7), 0 0 10px 3px rgba(34,197,94,0.35)",
                  }}
                />
              )}

              {/* Ripple rings — rendered outside button so they overflow */}
              {isRecharging && <>
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full pointer-events-none orb-ring-1"
                  style={{ border: "2px solid rgba(34,197,94,0.55)" }} />
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full pointer-events-none orb-ring-2"
                  style={{ border: "1.5px solid rgba(34,197,94,0.3)" }} />
              </>}

              {/* Orb */}
              <button
                onClick={() => handleToggle(item.id, item.completedToday)}
                className={`w-16 h-16 rounded-full relative flex items-center justify-center
                  cursor-pointer select-none transition-all duration-300 ease-out
                  ${staleness === "empty" ? "border-dashed border-2" : "border"}
                  ${isRecharging ? "orb-recharge" : ""}
                `}
                style={{
                  background: orbStyle.background,
                  backdropFilter: "blur(var(--glass-blur))",
                  WebkitBackdropFilter: "blur(var(--glass-blur))",
                  borderColor: orbStyle.borderColor,
                  boxShadow: orbStyle.boxShadow,
                  transform: isHovered && !isRecharging ? "translateY(-3px)" : "translateY(0)",
                }}
              >
                {/* Subtle specular highlight */}
                <span
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background: "radial-gradient(ellipse at 38% 22%, rgba(255,255,255,0.14) 0%, transparent 45%)",
                  }}
                />

                {/* Spark particles on completion */}
                {isRecharging && [0, 60, 120, 180, 240, 300].map((angle, i) => (
                  <span
                    key={angle}
                    className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full pointer-events-none"
                    style={{
                      background: i % 2 === 0 ? "rgba(34,197,94,0.9)" : "rgba(134,239,172,0.8)",
                      marginTop: "-3px",
                      marginLeft: "-3px",
                      ["--spark-angle" as string]: `${angle}deg`,
                      animation: `orb-spark 0.55s ease-out ${i * 25}ms forwards`,
                    }}
                  />
                ))}

                {/* Emoji */}
                <span className="relative text-2xl leading-none drop-shadow-sm">{item.emoji}</span>

                {/* Completion shown via green orb glow only — no badge */}
              </button>

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
