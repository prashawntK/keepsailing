"use client";

import { cn } from "@/lib/utils";

interface LinearTimerBarProps {
  elapsed: number; // seconds
  duration: number | null; // target seconds, null = open-ended
}

export function LinearTimerBar({ elapsed, duration }: LinearTimerBarProps) {
  const isComplete = duration != null && elapsed >= duration;
  const progress = duration != null ? Math.min(100, (elapsed / duration) * 100) : null;

  // Colour stops: primary while running, success when complete
  const barColor = isComplete ? "bg-success" : "bg-primary";
  const glowColor = isComplete
    ? "0 0 8px 2px rgba(34, 197, 94, 0.4)"
    : "0 0 8px 2px rgba(99, 102, 241, 0.4)";

  return (
    <div className="w-full h-1.5 rounded-full bg-surface-2/60 overflow-hidden">
      {progress != null ? (
        /* Timed mode — linear fill */
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-linear",
            barColor
          )}
          style={{
            width: `${progress}%`,
            boxShadow: glowColor,
          }}
        />
      ) : (
        /* Open-ended mode — pulsing bar */
        <div
          className={cn(
            "h-full rounded-full bg-primary animate-pulse",
          )}
          style={{
            width: "40%",
            boxShadow: "0 0 8px 2px rgba(99, 102, 241, 0.4)",
          }}
        />
      )}
    </div>
  );
}
