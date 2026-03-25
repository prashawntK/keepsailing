"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Square, X, Minimize2 } from "lucide-react";
import { useTimer } from "@/components/providers/TimerProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { formatTimerDisplay } from "@/lib/utils";
import type { GoalWithProgress } from "@/types";

interface TimerFocusModalProps {
  open: boolean;
  onClose: () => void;
  onStop: () => void;
  onCancel: () => void;
  goals?: GoalWithProgress[];
}

/* ── Atom rings ── */
const ATOM_RINGS = [
  { id: 0, rx: 140, ry: 36, groupRotate: 0,  dur: 3.4, sweep: 1 as const, opacity: 1.0 },
  { id: 1, rx: 42,  ry: 140, groupRotate: 10, dur: 5.2, sweep: 0 as const, opacity: 0.85 },
  { id: 2, rx: 114, ry: 64, groupRotate: 50, dur: 4.1, sweep: 1 as const, opacity: 0.7 },
];

function ellipsePath(rx: number, ry: number, sweep: 0 | 1) {
  return `M ${rx} 0 A ${rx} ${ry} 0 1 ${sweep} -${rx} 0 A ${rx} ${ry} 0 1 ${sweep} ${rx} 0`;
}

function AtomAnimation({ color, isLight }: { color: string; isLight: boolean }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg width="340" height="340" viewBox="-170 -170 340 340" style={{ overflow: "visible" }}>
        <defs>
          {ATOM_RINGS.map(r => (
            <filter key={r.id} id={`atom-glow-${r.id}`} x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
          <filter id="ring-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="nucleus-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.5" />
            <stop offset="60%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="0" cy="0" r="32" fill="url(#nucleus-grad)" />

        <circle cx="0" cy="0" r="20" fill="none" stroke={color} strokeWidth="1.2" strokeOpacity="0.4">
          <animate attributeName="r" values="19;22;19" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.4;0.15;0.4" dur="2.4s" repeatCount="indefinite" />
        </circle>

        {ATOM_RINGS.map(ring => (
          <g key={ring.id} transform={`rotate(${ring.groupRotate})`} opacity={ring.opacity}>
            <ellipse
              cx="0" cy="0" rx={ring.rx} ry={ring.ry}
              fill="none" stroke={color} strokeWidth="1.5"
              strokeOpacity={isLight ? 0.35 : 0.28}
              filter="url(#ring-glow)"
            />
            <circle r="7" fill={color} opacity="0.9" filter={`url(#atom-glow-${ring.id})`}>
              <animateMotion
                dur={`${ring.dur}s`}
                repeatCount="indefinite"
                calcMode="linear"
                path={ellipsePath(ring.rx, ring.ry, ring.sweep)}
              />
            </circle>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ── Floating particles ── */
const PARTICLES = Array.from({ length: 7 }, (_, i) => ({
  id: i,
  size: 3 + Math.random() * 4,
  duration: 8 + Math.random() * 4,
  delay: Math.random() * -8,
  xPath: [
    Math.random() * 120 - 60,
    Math.random() * 120 - 60,
    Math.random() * 120 - 60,
    Math.random() * 120 - 60,
  ],
  yPath: [
    Math.random() * 120 - 60,
    Math.random() * 120 - 60,
    Math.random() * 120 - 60,
    Math.random() * 120 - 60,
  ],
  opacity: 0.15 + Math.random() * 0.25,
}));

/* ── Milestone messages ── */
function getMilestone(pct: number): { emoji: string; text: string } | null {
  if (pct >= 100) return { emoji: "🎉", text: "Complete!" };
  if (pct >= 75) return { emoji: "🔥", text: "Almost there!" };
  if (pct >= 50) return { emoji: "⚡", text: "Halfway!" };
  if (pct >= 25) return { emoji: "💪", text: "Great start!" };
  return null;
}

/* ── SVG Progress Ring ── */
function ProgressRingLarge({
  percentage,
  color,
}: {
  percentage: number;
  color: string;
}) {
  const size = 200;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="ring-glow-pulse" style={{ color }}>
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        opacity={0.1}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transform: "rotate(-90deg)",
          transformOrigin: "center",
          transition: "stroke-dashoffset 0.8s ease",
        }}
      />
    </svg>
  );
}

/* ── Main Modal ── */
export function TimerFocusModal({
  open,
  onClose,
  onStop,
  onCancel,
  goals,
}: TimerFocusModalProps) {
  const { timerState, displayTime, totalElapsed } = useTimer();
  const { theme } = useTheme();
  const isLight = theme === "lucid-light";
  const prevMilestoneRef = useRef<number>(-1);
  const [milestoneKey, setMilestoneKey] = useState(0);

  const activeGoal = timerState.isRunning
    ? goals?.find((g) => g.id === timerState.goalId)
    : undefined;

  const timerName = timerState.targetName ?? activeGoal?.name ?? "Timer";
  const timerEmoji = timerState.targetEmoji ?? activeGoal?.emoji ?? "⏱️";
  const stepLabel = activeGoal?.currentStep?.name ?? null;

  const duration = timerState.targetDuration;
  const isComplete = duration != null && totalElapsed >= duration;
  const pct = duration ? Math.min((totalElapsed / duration) * 100, 100) : 0;
  const color = isComplete
    ? "#22C55E"
    : pct > 80
    ? "#34D399"
    : pct > 50
    ? "#F59E0B"
    : "var(--color-primary)";

  // Resolve CSS variable for SVG
  const resolvedColor = useMemo(() => {
    if (typeof window === "undefined") return "#6366F1";
    if (!color.startsWith("var(")) return color;
    const style = getComputedStyle(document.documentElement);
    return style.getPropertyValue("--color-primary").trim() || "#6366F1";
  }, [color]);

  const milestone = duration ? getMilestone(pct) : null;

  // Ambient blob colors — indigo → amber → green with progress
  const [washR, washG, washB, washA] = useMemo((): [number, number, number, number] => {
    if (isComplete) return [34, 197, 94, 0.22];
    if (!duration) return [99, 102, 241, 0.13];
    if (pct < 50) {
      const t = pct / 50;
      return [
        Math.round(99 + (245 - 99) * t),
        Math.round(102 + (158 - 102) * t),
        Math.round(241 + (11 - 241) * t),
        0.1 + t * 0.08,
      ];
    }
    const t = (pct - 50) / 50;
    return [
      Math.round(245 + (34 - 245) * t),
      Math.round(158 + (197 - 158) * t),
      Math.round(11 + (94 - 11) * t),
      0.18 + t * 0.04,
    ];
  }, [pct, duration, isComplete]);

  const washColor = `rgba(${washR},${washG},${washB},${washA})`;
  const washColorDim = `rgba(${washR},${washG},${washB},${washA * 0.5})`;

  // Track milestone changes for bounce animation
  const currentMilestoneLevel =
    pct >= 100 ? 4 : pct >= 75 ? 3 : pct >= 50 ? 2 : pct >= 25 ? 1 : 0;

  useEffect(() => {
    if (currentMilestoneLevel > prevMilestoneRef.current) {
      setMilestoneKey((k) => k + 1);
    }
    prevMilestoneRef.current = currentMilestoneLevel;
  }, [currentMilestoneLevel]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Ambient blobs — offset spots for depth instead of uniform wash */}
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-[2000ms] ease-in-out"
            style={{
              background: `
                radial-gradient(ellipse 45% 40% at 18% 22%, ${washColor} 0%, transparent 100%),
                radial-gradient(ellipse 38% 32% at 82% 72%, ${washColor} 0%, transparent 100%),
                radial-gradient(ellipse 28% 22% at 72% 18%, ${washColorDim} 0%, transparent 100%)
              `,
            }}
          />

          {/* Card + buttons stacked */}
          <div className="relative flex flex-col items-center z-10">

          {/* No card — atom floats directly over backdrop */}
          <motion.div
            className="w-[90vw] max-w-lg"
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Content */}
            <div className="flex flex-col items-center px-6 pt-8 pb-6">
              {/* Name only (no emoji) */}
              {timerName && (
                <span className={`text-sm font-medium mb-1 ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                  {timerName}
                </span>
              )}
              {stepLabel && (
                <span className={`text-xs mb-2 ${isLight ? "text-gray-400" : "text-gray-500"}`}>
                  {stepLabel}
                </span>
              )}

              {/* Central animation area */}
              <div className="relative flex items-center justify-center my-1 w-[340px] h-[340px]">
                <AtomAnimation color={resolvedColor} isLight={isLight} />

                {/* Time as nucleus — small to fit inside */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={displayTime}
                      className="text-lg font-mono font-bold tabular-nums"
                      style={{ color: resolvedColor }}
                      initial={{ y: 4, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -4, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {displayTime}
                    </motion.span>
                  </AnimatePresence>
                  {duration && (
                    <span className={`text-[10px] mt-0.5 font-mono ${isLight ? "text-gray-400" : "text-gray-500"}`}>
                      / {formatTimerDisplay(duration)}
                    </span>
                  )}
                </div>

                {/* Completion burst */}
                {isComplete && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="absolute w-[260px] h-[260px] rounded-full orb-ring-1" style={{ border: `2px solid ${resolvedColor}` }} />
                    <div className="absolute w-[260px] h-[260px] rounded-full orb-ring-2" style={{ border: `2px solid ${resolvedColor}` }} />
                  </div>
                )}
              </div>

              {/* Milestone text */}
              {milestone && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={milestoneKey}
                    className="flex items-center gap-2"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <motion.span className="text-lg" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.4, delay: 0.1 }}>
                      {milestone.emoji}
                    </motion.span>
                    <span className={`text-sm font-semibold ${isLight ? "text-gray-600" : "text-gray-300"}`}>
                      {milestone.text}
                    </span>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </motion.div>

          {/* Icon-only buttons — blended below the atom */}
          <div className="flex items-center gap-6 mt-4">
            {/* Discard */}
            <button
              onClick={onCancel}
              title="Discard"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isLight
                  ? "text-gray-400 hover:text-red-400 bg-black/5 hover:bg-red-500/10"
                  : "text-white/30 hover:text-red-400 bg-white/5 hover:bg-red-500/10"
              }`}
            >
              <X size={16} strokeWidth={1.8} />
            </button>

            {/* Minimize */}
            <button
              onClick={onClose}
              title="Minimize"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isLight
                  ? "text-gray-400 hover:text-gray-600 bg-black/5 hover:bg-black/10"
                  : "text-white/30 hover:text-white/60 bg-white/5 hover:bg-white/10"
              }`}
            >
              <Minimize2 size={15} strokeWidth={1.8} />
            </button>

            {/* Stop & Save */}
            <button
              onClick={onStop}
              title="Stop & Save"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isLight
                  ? "text-red-400 hover:text-red-500 bg-red-500/10 hover:bg-red-500/20"
                  : "text-red-400/60 hover:text-red-400 bg-red-500/8 hover:bg-red-500/15"
              }`}
            >
              <Square size={13} strokeWidth={1.8} fill="currentColor" />
            </button>
          </div>

          </div> {/* end card+buttons wrapper */}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
