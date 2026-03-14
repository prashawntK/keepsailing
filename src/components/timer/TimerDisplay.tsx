"use client";

import { useState, useEffect } from "react";
import { Square } from "lucide-react";
import { useTimer } from "@/components/providers/TimerProvider";
import { LinearTimerBar } from "./LinearTimerBar";
import { formatTimerDisplay } from "@/lib/utils";
import { useToast } from "@/lib/toast";
import type { GoalWithProgress } from "@/types";

interface TimerDisplayProps {
  onRefresh: () => void;
  goals?: GoalWithProgress[];
}

export function TimerDisplay({ onRefresh, goals }: TimerDisplayProps) {
  const { timerState, displayTime, totalElapsed, stopTimer } = useTimer();
  const { success: toastSuccess } = useToast();
  const [toasted, setToasted] = useState(false);

  const activeGoal = timerState.isRunning
    ? goals?.find((g) => g.id === timerState.goalId)
    : undefined;

  const timerName = timerState.targetName ?? activeGoal?.name ?? "Timer";
  const timerEmoji = timerState.targetEmoji ?? activeGoal?.emoji ?? "⏱️";
  const stepLabel = activeGoal?.currentStep ? ` · ${activeGoal.currentStep.name}` : "";

  const duration = timerState.targetDuration;
  const isComplete = duration != null && totalElapsed >= duration;

  useEffect(() => {
    if (isComplete && !toasted) {
      setToasted(true);
      toastSuccess("Timer complete!", `${timerEmoji} ${timerName}`);
    }
  }, [isComplete, toasted, timerEmoji, timerName, toastSuccess]);

  if (!timerState.isRunning) return null;

  function handleStop() {
    stopTimer();
    setToasted(false);
    onRefresh();
  }

  // "01:23 / 30:00" when timed, plain "01:23" when open-ended
  const timeDisplay =
    duration != null
      ? `${displayTime} / ${formatTimerDisplay(duration)}`
      : displayTime;

  return (
    <div className="fixed bottom-20 left-0 right-0 mx-4 z-40 md:bottom-4 md:right-4 md:left-auto md:w-72">
      <div
        className="rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "var(--color-surface-1)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderTop: "1px solid rgba(255,255,255,0.13)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        {/* Single compact row */}
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <span className="text-sm flex-shrink-0">{timerEmoji}</span>

          <p className="flex-1 min-w-0 text-xs font-medium text-gray-300 truncate">
            {timerName}
            {stepLabel && <span className="text-gray-500">{stepLabel}</span>}
          </p>

          <span
            className="text-xs font-mono font-bold tabular-nums flex-shrink-0"
            style={{ color: isComplete ? "var(--color-success)" : "var(--color-primary)" }}
          >
            {timeDisplay}
          </span>

          <button
            onClick={handleStop}
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: "rgba(239,68,68,0.15)", color: "var(--color-error)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.28)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,0.15)")}
          >
            <Square size={11} fill="currentColor" />
          </button>
        </div>

        {/* Progress bar flush at the bottom */}
        <LinearTimerBar elapsed={totalElapsed} duration={duration} />
      </div>
    </div>
  );
}
