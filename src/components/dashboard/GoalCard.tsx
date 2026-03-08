"use client";

import { useState } from "react";
import { Timer, Check, Plus, ChevronRight } from "lucide-react";
import { cn, formatHours, getStatusBg, CATEGORY_COLORS, PRIORITY_COLORS } from "@/lib/utils";
import { StreakBadge } from "@/components/dashboard/StreakBadge";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { useTimer } from "@/components/providers/TimerProvider";
import { GoalDetail } from "@/components/goals/GoalDetail";
import type { GoalWithProgress } from "@/types";

interface GoalCardProps {
  goal: GoalWithProgress;
  onRefresh: () => void;
}

export function GoalCard({ goal, onRefresh }: GoalCardProps) {
  const { timerState, startTimer, stopTimer } = useTimer();

  // Optimistic local state — updates instantly, DB syncs in background
  const [optimisticCompleted, setOptimisticCompleted] = useState<boolean | null>(null);
  const [optimisticTime, setOptimisticTime] = useState<number | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualMinutes, setManualMinutes] = useState("30");
  const [showDetail, setShowDetail] = useState(false);

  const isActive = timerState.goalId === goal.id && timerState.isRunning;

  // Use optimistic values if set, otherwise use server values
  const displayCompleted = optimisticCompleted ?? goal.todayLog?.completed ?? false;
  const displayTimeSpent = optimisticTime ?? goal.todayLog?.timeSpent ?? 0;

  const rawPct = goal.goalType === "checkbox"
    ? (displayCompleted ? 100 : 0)
    : goal.dailyTarget > 0
      ? Math.min(120, (displayTimeSpent / goal.dailyTarget) * 100)
      : 0;
  const pct = Math.min(rawPct, 100);
  const statusBg = getStatusBg(pct);

  const ringColor = pct >= 100 ? "#22C55E" : pct >= 80 ? "#34D399" : pct >= 50 ? "#F59E0B" : "#F87171";

  async function handleTimerClick() {
    if (isActive) {
      await stopTimer();
    } else {
      await startTimer(goal.id);
    }
    // Refresh in background — timer state already updated in TimerProvider
    onRefresh();
  }

  async function handleCheckboxToggle() {
    const hasSteps = goal.steps.length > 0;

    if (!hasSteps) {
      // No steps — simple toggle with optimistic UI
      const newVal = !displayCompleted;
      setOptimisticCompleted(newVal);
      try {
        await fetch("/api/logs/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goalId: goal.id }),
        });
        onRefresh();
      } catch {
        setOptimisticCompleted(!newVal);
      }
    } else {
      // Has steps — advancing one step doesn't complete the goal.
      // Don't set optimistic state; let refresh show correct state.
      try {
        await fetch("/api/logs/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goalId: goal.id }),
        });
        onRefresh();
      } catch {
        // nothing to revert
      }
    }
  }

  async function handleCompleteStep() {
    if (!goal.currentStep) return;
    try {
      const res = await fetch("/api/steps/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId: goal.currentStep.id }),
      });
      if (!res.ok) {
        console.error("Failed to complete step:", await res.text());
        return;
      }
      onRefresh();
    } catch (err) {
      console.error("Error completing step:", err);
    }
  }

  async function handleManualAdd() {
    const mins = parseFloat(manualMinutes);
    if (isNaN(mins) || mins <= 0) return;
    const addedHours = mins / 60;

    // Optimistic update — add time instantly
    setOptimisticTime((displayTimeSpent) + addedHours);
    setShowManual(false);

    try {
      await fetch("/api/timer/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId: goal.id, minutes: mins }),
      });
      onRefresh();
    } catch {
      // Revert on error
      setOptimisticTime(null);
    }
  }

  return (
    <div
      className={cn(
        "relative p-4 rounded-2xl border transition-all duration-200",
        statusBg,
        isActive && "ring-2 ring-primary/60"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Emoji + progress ring for timer goals */}
        <div className="relative flex-shrink-0">
          {goal.goalType === "timer" ? (
            <div className="relative">
              <ProgressRing percentage={pct} size={44} strokeWidth={4} color={ringColor} />
              <div className="absolute inset-0 flex items-center justify-center text-lg">
                {goal.emoji}
              </div>
            </div>
          ) : (
            <button
              onClick={handleCheckboxToggle}
              className={cn(
                "w-9 h-9 rounded-full border-2 flex items-center justify-center text-base transition-all duration-150",
                displayCompleted
                  ? "border-success bg-success/20 scale-105"
                  : "border-surface-4 bg-surface-2 hover:border-surface-3"
              )}
            >
              {displayCompleted ? <Check size={16} className="text-success" /> : goal.emoji}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowDetail(true)}
              className="font-semibold text-gray-100 truncate hover:text-primary-light transition-colors text-left"
            >
              {goal.name}
            </button>
            <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", PRIORITY_COLORS[goal.priority])}>
              {goal.priority}
            </span>
            <span className={cn("text-xs", CATEGORY_COLORS[goal.category])}>{goal.category}</span>
          </div>

          {/* Current step indicator */}
          {goal.currentStep && (
            <div className="mt-1 flex items-center gap-1">
              <ChevronRight size={12} className="text-gray-600 flex-shrink-0" />
              <span className="text-sm text-primary-light font-medium truncate">{goal.currentStep.name}</span>
              {goal.steps.length > 1 && (
                <span className="text-xs text-gray-500 flex-shrink-0">
                  ({goal.steps.filter((s) => s.completedAt !== null).length + 1}/{goal.steps.length})
                </span>
              )}
            </div>
          )}

          {goal.goalType === "timer" && (
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-400">
              <span>
                {formatHours(displayTimeSpent)} / {formatHours(goal.dailyTarget)}
              </span>
              <span className="text-gray-600">·</span>
              <span className={pct >= 100 ? "text-success" : "text-gray-500"}>
                {Math.round(pct)}%
              </span>
            </div>
          )}

          {goal.streak.currentStreak > 0 && (
            <div className="mt-1">
              <StreakBadge streak={goal.streak.currentStreak} size="sm" showLabel={false} />
            </div>
          )}
        </div>

        {/* Timer actions */}
        {goal.goalType === "timer" && (
          <div className="flex flex-row gap-1.5 flex-shrink-0">
            <button
              onClick={handleTimerClick}
              className={cn(
                "p-2 rounded-xl transition-all duration-150",
                isActive
                  ? "bg-error/20 text-error hover:bg-error/30"
                  : "bg-primary/20 text-primary hover:bg-primary/30"
              )}
            >
              <Timer size={16} />
            </button>
            <button
              onClick={() => setShowManual((s) => !s)}
              className="p-2 rounded-xl bg-surface-3/50 text-gray-400 hover:text-gray-200 transition-all"
            >
              <Plus size={14} />
            </button>
            {goal.currentStep && (
              <button
                onClick={handleCompleteStep}
                title="Complete current step"
                className="p-2 rounded-xl bg-success/15 text-success hover:bg-success/25 transition-all"
              >
                <Check size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Manual time entry */}
      {showManual && (
        <div className="mt-3 flex gap-2">
          <input
            type="number"
            min="1"
            max="480"
            value={manualMinutes}
            onChange={(e) => setManualMinutes(e.target.value)}
            placeholder="Minutes"
            className="flex-1 bg-surface-2 border border-white/[0.08] rounded-lg px-2 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleManualAdd}
            className="px-3 py-1.5 bg-primary hover:bg-primary-light text-white text-sm rounded-lg transition-all"
          >
            Add
          </button>
          <button
            onClick={() => setShowManual(false)}
            className="px-3 py-1.5 text-gray-500 hover:text-gray-300 text-sm"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Active timer pulse */}
      {isActive && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
      )}

      {/* Goal detail modal */}
      {showDetail && (
        <GoalDetail
          goal={goal}
          onClose={() => setShowDetail(false)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}
