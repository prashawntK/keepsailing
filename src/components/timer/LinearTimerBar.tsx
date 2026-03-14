"use client";

import { motion } from "framer-motion";

interface LinearTimerBarProps {
  elapsed: number;   // seconds
  duration: number | null; // target seconds, null = open-ended
}

export function LinearTimerBar({ elapsed, duration }: LinearTimerBarProps) {
  const isComplete = duration != null && elapsed >= duration;
  const progress = duration != null ? Math.min(100, (elapsed / duration) * 100) : null;

  if (progress != null) {
    // Timed mode — always animates FROM 0% (initial) to current progress
    const color = isComplete ? "var(--color-success)" : "var(--color-primary)";
    const glow = isComplete
      ? "0 0 8px rgba(34,197,94,0.7)"
      : "0 0 8px rgba(99,102,241,0.7)";
    return (
      <div className="w-full h-[2px] bg-white/[0.07]">
        <motion.div
          className="h-full"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "linear" }}
          style={{ background: color, boxShadow: glow }}
        />
      </div>
    );
  }

  // Open-ended mode — scanning shimmer left → right, loops
  return (
    <div className="relative w-full h-[2px] bg-white/[0.07] overflow-hidden">
      <div
        style={{
          position: "absolute",
          inset: "0 auto 0 0",
          width: "45%",
          background:
            "linear-gradient(90deg, transparent, var(--color-primary), transparent)",
          animation: "timer-scan 1.8s cubic-bezier(0.4,0,0.6,1) infinite",
        }}
      />
    </div>
  );
}
