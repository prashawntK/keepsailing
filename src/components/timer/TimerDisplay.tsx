"use client";

import { useState } from "react";
import { Square, Star } from "lucide-react";
import { useTimer } from "@/components/providers/TimerProvider";

import type { GoalWithProgress } from "@/types";

interface TimerDisplayProps {
  onRefresh: () => void;
  goals?: GoalWithProgress[];
}

export function TimerDisplay({ onRefresh, goals }: TimerDisplayProps) {
  const { timerState, displayTime, stopTimer } = useTimer();
  const activeGoal = goals?.find((g) => g.id === timerState.goalId);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);

  if (!timerState.isRunning) return null;

  async function handleStop(focusRating?: number) {
    await stopTimer(focusRating);
    setShowRating(false);
    setRating(0);
    onRefresh();
  }

  function handleStopClick() {
    setShowRating(true);
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 mx-4 z-40 md:bottom-4 md:right-4 md:left-auto md:w-72">
      <div className="bg-surface-1 border border-primary/30 rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden">
        {!showRating ? (
          <div className="flex items-center gap-3 p-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-primary font-medium mb-0.5">
                Timer running{activeGoal?.currentStep ? ` · ${activeGoal.currentStep.name}` : ""}
              </p>
              <p className="text-2xl font-mono font-bold text-gray-100 tabular-nums">
                {displayTime}
              </p>
            </div>
            <button
              onClick={handleStopClick}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-error/20 hover:bg-error/30 text-error flex items-center justify-center transition-all"
            >
              <Square size={18} fill="currentColor" />
            </button>
          </div>
        ) : (
          <div className="p-4">
            <p className="text-sm text-gray-300 font-medium mb-3 text-center">
              How was your focus? (optional)
            </p>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className="transition-all"
                >
                  <Star
                    size={28}
                    className={n <= rating ? "text-streak fill-streak" : "text-gray-600"}
                  />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleStop(rating > 0 ? rating : undefined)}
                className="flex-1 py-2 bg-primary hover:bg-primary-light text-white text-sm font-semibold rounded-xl transition-all"
              >
                Stop timer
              </button>
              <button
                onClick={() => handleStop()}
                className="px-4 py-2 text-gray-500 hover:text-gray-300 text-sm transition-all"
              >
                Skip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
