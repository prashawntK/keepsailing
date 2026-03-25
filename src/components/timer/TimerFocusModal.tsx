"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minimize2, Square, X } from "lucide-react";
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

          {/* Modal */}
          <motion.div
            className="relative w-[90vw] max-w-md rounded-3xl overflow-hidden"
            style={{
              background: isLight
                ? "rgba(255,255,255,0.85)"
                : "var(--glass-panel-bg, rgba(15,15,15,0.9))",
              border: isLight
                ? "1px solid rgba(0,0,0,0.08)"
                : "1px solid rgba(255,255,255,0.08)",
              boxShadow: isLight
                ? "0 25px 60px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9)"
                : "0 25px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
            }}
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Minimize button */}
            <button
              onClick={onClose}
              className={`absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isLight
                  ? "text-gray-400 hover:text-gray-600 hover:bg-black/5"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              <Minimize2 size={16} />
            </button>

            {/* Content */}
            <div className="flex flex-col items-center px-6 pt-10 pb-8">
              {/* Emoji + name */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{timerEmoji}</span>
                {timerName && (
                  <span
                    className={`text-sm font-medium ${
                      isLight ? "text-gray-600" : "text-gray-400"
                    }`}
                  >
                    {timerName}
                  </span>
                )}
              </div>

              {stepLabel && (
                <span
                  className={`text-xs mb-4 ${
                    isLight ? "text-gray-500" : "text-gray-500"
                  }`}
                >
                  {stepLabel}
                </span>
              )}

              {/* Central animation area */}
              <div className="relative flex items-center justify-center my-6 w-[200px] h-[200px]">
                {/* Floating particles */}
                {PARTICLES.map((p) => (
                  <motion.div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                      width: p.size,
                      height: p.size,
                      background: resolvedColor,
                      opacity: p.opacity,
                      top: "50%",
                      left: "50%",
                    }}
                    animate={{
                      x: p.xPath,
                      y: p.yPath,
                    }}
                    transition={{
                      duration: p.duration,
                      repeat: Infinity,
                      repeatType: "mirror",
                      ease: "easeInOut",
                      delay: p.delay,
                    }}
                  />
                ))}

                {/* Progress ring or breathing circle */}
                {duration ? (
                  <>
                    <ProgressRingLarge
                      percentage={pct}
                      color={resolvedColor}
                    />

                    {/* Completion burst */}
                    {isComplete && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div
                          className="absolute w-[200px] h-[200px] rounded-full orb-ring-1"
                          style={{
                            border: `2px solid ${resolvedColor}`,
                          }}
                        />
                        <div
                          className="absolute w-[200px] h-[200px] rounded-full orb-ring-2"
                          style={{
                            border: `2px solid ${resolvedColor}`,
                          }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  /* Open-ended: breathing circle */
                  <motion.div
                    className="w-[160px] h-[160px] rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${resolvedColor}22 0%, ${resolvedColor}08 60%, transparent 70%)`,
                      border: `1.5px solid ${resolvedColor}33`,
                    }}
                    animate={{
                      scale: [1, 1.08, 1],
                      opacity: [0.6, 0.85, 0.6],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}

                {/* Time display overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={displayTime}
                      className="text-5xl font-mono font-bold tabular-nums"
                      style={{ color: resolvedColor }}
                      initial={{ y: 8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -8, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {displayTime}
                    </motion.span>
                  </AnimatePresence>
                  {duration && (
                    <span
                      className={`text-xs mt-1 font-mono ${
                        isLight ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      / {formatTimerDisplay(duration)}
                    </span>
                  )}
                </div>
              </div>

              {/* Milestone text */}
              {milestone && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={milestoneKey}
                    className="flex items-center gap-2 mb-4"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <motion.span
                      className="text-xl"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                    >
                      {milestone.emoji}
                    </motion.span>
                    <span
                      className={`text-sm font-semibold ${
                        isLight ? "text-gray-600" : "text-gray-300"
                      }`}
                    >
                      {milestone.text}
                    </span>
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Action row */}
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={onCancel}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isLight
                      ? "text-gray-500 hover:text-red-500 bg-black/5 hover:bg-red-500/10"
                      : "text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <X size={14} />
                    Discard
                  </span>
                </button>
                <button
                  onClick={onStop}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/40 transition-all"
                >
                  <span className="flex items-center gap-1.5">
                    <Square size={10} fill="currentColor" />
                    Stop & Save
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
