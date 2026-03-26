"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Square, X, Minimize2 } from "lucide-react";
import Lottie from "lottie-react";
import { useTimer } from "@/components/providers/TimerProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { formatTimerDisplay } from "@/lib/utils";
import { applyNewshipTheme } from "@/lib/lottieTheme";
import type { Theme } from "@/components/providers/ThemeProvider";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const newshipRaw = require("../../../public/animations/newship.json");
import type { GoalWithProgress } from "@/types";

// Module-level cache — each theme is processed once ever, never on re-render
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const animCache = new Map<Theme, any>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getThemedAnimation(theme: Theme): any {
  if (!animCache.has(theme)) {
    animCache.set(theme, applyNewshipTheme(newshipRaw, theme));
  }
  return animCache.get(theme);
}

interface TimerFocusModalProps {
  open: boolean;
  onClose: () => void;
  onStop: () => void;
  onCancel: () => void;
  goals?: GoalWithProgress[];
}

/* ── Milestone messages ── */
function getMilestone(pct: number): { emoji: string; text: string } | null {
  if (pct >= 100) return { emoji: "🎉", text: "Complete!" };
  if (pct >= 75)  return { emoji: "🔥", text: "Almost there!" };
  if (pct >= 50)  return { emoji: "⚡", text: "Halfway!" };
  if (pct >= 25)  return { emoji: "💪", text: "Great start!" };
  return null;
}

/* ── Thin progress ring wrapping the Lottie ── */
function ProgressRing({ percentage, color, size = 300, strokeWidth = 4 }: {
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      className="absolute inset-0 ring-glow-pulse pointer-events-none"
      style={{ color }}
    >
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="currentColor" strokeWidth={strokeWidth} opacity={0.12}
      />
      {/* Progress arc */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="currentColor" strokeWidth={strokeWidth}
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

  const timerName  = timerState.targetName  ?? activeGoal?.name  ?? "Timer";
  const timerEmoji = timerState.targetEmoji ?? activeGoal?.emoji ?? "⏱️";
  const stepLabel  = activeGoal?.currentStep?.name ?? null;

  const duration   = timerState.targetDuration;
  const isComplete = duration != null && totalElapsed >= duration;
  const pct        = duration ? Math.min((totalElapsed / duration) * 100, 100) : 0;

  const color = isComplete
    ? "#22C55E"
    : pct > 80 ? "#34D399"
    : pct > 50 ? "#F59E0B"
    : "var(--color-primary)";

  // Resolve CSS variable so SVG and Lottie can use a real hex
  const resolvedColor = useMemo(() => {
    if (typeof window === "undefined") return "#6366F1";
    if (!color.startsWith("var(")) return color;
    return getComputedStyle(document.documentElement)
      .getPropertyValue("--color-primary").trim() || "#6366F1";
  }, [color]);


  const milestone = duration ? getMilestone(pct) : null;

  // Ambient blob wash: indigo → amber → green as progress advances
  const [washR, washG, washB, washA] = useMemo((): [number, number, number, number] => {
    if (isComplete)   return [34,  197, 94,  0.22];
    if (!duration)    return [99,  102, 241, 0.13];
    if (pct < 50) {
      const t = pct / 50;
      return [
        Math.round(99  + (245 - 99)  * t),
        Math.round(102 + (158 - 102) * t),
        Math.round(241 + (11  - 241) * t),
        0.1 + t * 0.08,
      ];
    }
    const t = (pct - 50) / 50;
    return [
      Math.round(245 + (34  - 245) * t),
      Math.round(158 + (197 - 158) * t),
      Math.round(11  + (94  - 11)  * t),
      0.18 + t * 0.04,
    ];
  }, [pct, duration, isComplete]);

  const washColor    = `rgba(${washR},${washG},${washB},${washA})`;
  const washColorDim = `rgba(${washR},${washG},${washB},${washA * 0.5})`;

  // Trigger milestone bounce whenever level ticks up
  const milestoneLevel = pct >= 100 ? 4 : pct >= 75 ? 3 : pct >= 50 ? 2 : pct >= 25 ? 1 : 0;
  useEffect(() => {
    if (milestoneLevel > prevMilestoneRef.current) {
      setMilestoneKey((k) => k + 1);
    }
    prevMilestoneRef.current = milestoneLevel;
  }, [milestoneLevel]);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
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

          {/* Ambient colour wash */}
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

          {/* Content stack */}
          <div className="relative flex flex-col items-center z-10 px-6">

            <motion.div
              className="w-[90vw] max-w-sm flex flex-col items-center"
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {/* Goal name + step label */}
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-sm font-medium ${isLight ? "text-gray-600" : "text-gray-300"}`}>
                  {timerName}
                </span>
              </div>
              {stepLabel && (
                <span className={`text-xs mb-3 ${isLight ? "text-gray-400" : "text-gray-500"}`}>
                  {stepLabel}
                </span>
              )}

              {/* Lottie + optional progress ring */}
              <div className="relative flex items-center justify-center w-[380px] h-[380px] isolate">
                {/* Progress ring sits on top of the animation when duration is set */}
                {duration && (
                  <ProgressRing percentage={pct} color={resolvedColor} size={380} strokeWidth={4} />
                )}

                {/* Canvas renderer is far lighter than SVG for complex animations */}
                <div
                  className="w-[340px] h-[340px]"
                  style={{
                    maskImage: "radial-gradient(ellipse 80% 75% at 50% 52%, black 45%, transparent 72%)",
                    WebkitMaskImage: "radial-gradient(ellipse 80% 75% at 50% 52%, black 45%, transparent 72%)",
                  }}
                >
                  <Lottie
                    animationData={getThemedAnimation(theme)}
                    loop
                    autoplay
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>

                {/* Completion burst rings */}
                {isComplete && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className="absolute rounded-full orb-ring-1"
                      style={{ width: 260, height: 260, border: `2px solid ${resolvedColor}` }}
                    />
                    <div
                      className="absolute rounded-full orb-ring-2"
                      style={{ width: 260, height: 260, border: `2px solid ${resolvedColor}` }}
                    />
                  </div>
                )}

                {/* Time overlaid at the bottom of the animation — no extra vertical space */}
                <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center pointer-events-none">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={displayTime}
                      className="text-5xl font-mono font-bold tabular-nums"
                      style={{ color: resolvedColor }}
                      initial={{ y: 6, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -6, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {displayTime}
                    </motion.span>
                  </AnimatePresence>
                  {duration && (
                    <span className={`text-xs mt-0.5 font-mono ${isLight ? "text-gray-400" : "text-gray-500"}`}>
                      / {formatTimerDisplay(duration)}
                    </span>
                  )}
                </div>
              </div>

              {/* Milestone badge */}
              {milestone && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={milestoneKey}
                    className="flex items-center gap-2 mt-3"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <motion.span
                      className="text-lg"
                      animate={{ scale: [1, 1.35, 1] }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                    >
                      {milestone.emoji}
                    </motion.span>
                    <span className={`text-sm font-semibold ${isLight ? "text-gray-600" : "text-gray-300"}`}>
                      {milestone.text}
                    </span>
                  </motion.div>
                </AnimatePresence>
              )}
            </motion.div>

            {/* Icon-only action buttons */}
            <div className="flex items-center gap-6 mt-6">
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

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
