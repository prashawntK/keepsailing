"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import { Maximize2, Square, X } from "lucide-react";
import { useTimer } from "@/components/providers/TimerProvider";
import { formatTimerDisplay, cn } from "@/lib/utils";
import { useToast } from "@/lib/toast";
import { useTheme } from "@/components/providers/ThemeProvider";
import { TimerFocusModal } from "./TimerFocusModal";
import type { GoalWithProgress } from "@/types";

interface TimerDisplayProps {
  onRefresh: () => void;
  goals?: GoalWithProgress[];
}

export function TimerDisplay({ onRefresh, goals }: TimerDisplayProps) {
  const { timerState, displayTime, totalElapsed, stopTimer, cancelTimer } = useTimer();
  const { success: toastSuccess } = useToast();
  const { theme } = useTheme();
  const isLight = theme === "lucid-light";
  const [toasted, setToasted] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function onEnter() {
    clearTimeout(leaveTimer.current);
    setHovered(true);
  }
  function onLeave() {
    leaveTimer.current = setTimeout(() => setHovered(false), 120);
  }

  const activeGoal = timerState.isRunning
    ? goals?.find((g) => g.id === timerState.goalId)
    : undefined;

  const timerName = timerState.targetName ?? activeGoal?.name ?? "Timer";
  const timerEmoji = timerState.targetEmoji ?? activeGoal?.emoji ?? "⏱️";

  const duration = timerState.targetDuration;
  const isComplete = duration != null && totalElapsed >= duration;
  const pct = duration ? Math.min((totalElapsed / duration) * 100, 100) : 0;
  const color = isComplete ? "#22C55E" : pct > 80 ? "#34D399" : pct > 50 ? "#F59E0B" : "var(--color-primary)";

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
    setFocusOpen(false);
    onRefresh();
  }

  function handleCancel() {
    cancelTimer();
    setToasted(false);
    setFocusOpen(false);
    onRefresh();
  }

  const pillStyle = {
    background: isLight ? "rgba(255,255,255,0.85)" : "#0a0a0a",
    border: isLight ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.08)",
    boxShadow: isLight
      ? `0 4px 20px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)`
      : `0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)`,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  };

  return (
    <Fragment>
      <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 md:bottom-28">
        <div className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
          {/* Floating icon buttons — pop up above on hover */}
          <div
            className={`absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 flex gap-1.5 transition-all duration-200 ${
              hovered ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none"
            }`}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
          >
            <button
              onClick={handleCancel}
              title="Discard"
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all border ${
                isLight
                  ? "bg-white/90 border-black/10 text-gray-500 hover:text-red-500 hover:border-red-300"
                  : "bg-[#1a1a1a] border-white/[0.08] text-gray-400 hover:text-red-400 hover:border-red-500/30"
              }`}
              style={{ backdropFilter: "blur(12px)" }}
            >
              <X size={11} />
            </button>
            {/* Maximize button hidden — work in progress */}
            <button
              onClick={handleStop}
              title="Stop & Save"
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all bg-red-500/15 border border-red-500/20 text-red-400 hover:bg-red-500/25 hover:border-red-500/40"
              style={{ backdropFilter: "blur(12px)" }}
            >
              <Square size={9} fill="currentColor" />
            </button>
          </div>

          {/* The pill */}
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 cursor-pointer",
              timerState.isRunning && !isComplete && "timer-breathing",
              isComplete && "timer-breathing-complete"
            )}
            style={{ ...pillStyle, borderRadius: "999px" }}
            onClick={() => setFocusOpen(true)}
          >
            <div className="flex items-center gap-2.5 px-4 py-2">
              <span className="relative flex-shrink-0">
                <span className="absolute inline-flex h-2 w-2 rounded-full opacity-75 animate-ping" style={{ background: color }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
              </span>

              <span className="text-sm flex-shrink-0">{timerEmoji}</span>

              <span className="text-xs font-mono font-bold tabular-nums flex-shrink-0" style={{ color }}>
                {displayTime}
                {duration && (
                  <span className="text-gray-600 font-normal"> / {formatTimerDisplay(duration)}</span>
                )}
              </span>

              {timerName && (
                <span className={`text-xs max-w-[80px] truncate hidden sm:block ${isLight ? "text-gray-500" : "text-gray-500"}`}>
                  {timerName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <TimerFocusModal
        open={focusOpen}
        onClose={() => setFocusOpen(false)}
        onStop={handleStop}
        onCancel={handleCancel}
        goals={goals}
      />
    </Fragment>
  );
}
