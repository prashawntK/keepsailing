"use client";

import { useState, useRef, useEffect } from "react";
import { Timer, Check, Plus, ChevronRight } from "lucide-react";
import { cn, formatHours, getStatusBg, CATEGORY_COLORS, PRIORITY_COLORS } from "@/lib/utils";
import { StreakBadge } from "@/components/dashboard/StreakBadge";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { useTimer } from "@/components/providers/TimerProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { GoalDetail } from "@/components/goals/GoalDetail";
import type { GoalWithProgress } from "@/types";

interface GoalCardProps {
  goal: GoalWithProgress;
  onRefresh: () => void;
}

export function GoalCard({ goal, onRefresh }: GoalCardProps) {
  const { timerState, startTimer, stopTimer } = useTimer();
  const { theme } = useTheme();
  const isLight = theme === "lucid-light";

  // Optimistic local state — updates instantly, DB syncs in background
  const [optimisticCompleted, setOptimisticCompleted] = useState<boolean | null>(null);
  const [optimisticTime, setOptimisticTime] = useState<number | null>(null);
  // Track which step ID was just completed — hides it instantly before server confirms
  const [completedStepId, setCompletedStepId] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualMinutes, setManualMinutes] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showManual) return;
    function onOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowManual(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [showManual]);
  const [showDetail, setShowDetail] = useState(false);

  const isActive = timerState.goalId === goal.id && timerState.isRunning;

  // Use optimistic values if set, otherwise use server values
  const displayCompleted = optimisticCompleted ?? goal.todayLog?.completed ?? false;
  const displayTimeSpent = optimisticTime ?? goal.todayLog?.timeSpent ?? 0;
  // Hide the current step indicator immediately when its complete button is clicked
  const displayCurrentStep = completedStepId === goal.currentStep?.id ? null : goal.currentStep;

  // If user starts working on a "banked" goal today, flip to real progress
  const isBanked = goal.isBanked && displayTimeSpent === 0;

  const rawPct = isBanked
    ? 100
    : goal.goalType === "checkbox"
      ? (displayCompleted ? 100 : 0)
      : goal.dailyTarget > 0
        ? Math.min(120, (displayTimeSpent / goal.dailyTarget) * 100)
        : 0;
  const pct = Math.min(rawPct, 100);
  const statusBg = getStatusBg(pct);

  // Sky-blue for banked, green shades for completed, amber/red for in-progress
  const ringColor = isBanked
    ? "#38BDF8"
    : pct >= 100 ? "#22C55E" : pct >= 80 ? "#34D399" : pct >= 50 ? "#F59E0B" : "#F87171";

  async function handleTimerClick() {
    if (isActive) {
      await stopTimer();
    } else {
      await startTimer(goal.id);
    }
    // Refresh in background — timer state already updated in TimerProvider
    onRefresh();
  }

  function handleCheckboxToggle() {
    const hasSteps = goal.steps.length > 0;

    if (!hasSteps) {
      // No steps — optimistic toggle, server syncs in background
      const newVal = !displayCompleted;
      setOptimisticCompleted(newVal);
      fetch("/api/logs/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId: goal.id }),
      })
        .then(() => onRefresh())
        .catch(() => setOptimisticCompleted(!newVal));
    } else {
      // Has steps — fire-and-forget, refresh brings correct next step
      fetch("/api/logs/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId: goal.id }),
      })
        .then(() => onRefresh())
        .catch(() => {});
    }
  }

  function handleCompleteStep() {
    if (!goal.currentStep) return;
    const stepId = goal.currentStep.id;
    setCompletedStepId(stepId); // instant: hide current step indicator
    fetch("/api/steps/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepId }),
    })
      .then((res) => {
        if (!res.ok) setCompletedStepId(null); // revert
        else onRefresh();
      })
      .catch(() => setCompletedStepId(null));
  }

  async function handleManualAdd() {
    const mins = parseFloat(manualMinutes);
    if (isNaN(mins) || mins <= 0) return;
    const addedHours = mins / 60;

    setOptimisticTime((displayTimeSpent) + addedHours);
    setShowManual(false);
    setManualMinutes("");

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
        "relative p-4 glass-card group transition-all duration-300 overflow-hidden",
        isActive && "ring-1 ring-primary/60 glow-primary border-primary/30",
        isBanked && "opacity-75"
      )}
      style={isLight ? undefined : {
        background: `linear-gradient(145deg, rgba(17, 24, 39, 0.3) 0%, rgba(17, 24, 39, 0.6) 100%), ${pct >= 100 ? 'rgba(34, 197, 94, 0.03)' : pct >= 80 ? 'rgba(52, 211, 153, 0.03)' : pct >= 50 ? 'rgba(245, 158, 11, 0.03)' : 'rgba(239, 68, 68, 0.03)'}`
      }}
    >
      {/* Neon glowing status strip on left edge */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-500 rounded-l-2xl"
        style={{ backgroundColor: ringColor, boxShadow: `0 0 12px 1px ${ringColor}` }}
      />
      
      <div className="flex items-center gap-3 relative z-10 pl-1">
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
          {displayCurrentStep && (
            <div className="mt-1 flex items-center gap-1">
              <ChevronRight size={12} className="text-gray-600 flex-shrink-0" />
              <span className="text-sm text-primary-light font-medium truncate">{displayCurrentStep.name}</span>
              {goal.steps.length > 1 && (
                <span className="text-xs text-gray-500 flex-shrink-0">
                  ({goal.steps.filter((s) => s.completedAt !== null).length + 1}/{goal.steps.length})
                </span>
              )}
            </div>
          )}

          {goal.goalType === "timer" && (
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-400">
              {isBanked ? (
                <span className="text-sky-400 font-medium text-xs">
                  ✓ Banked · {formatHours(goal.bankingInfo?.weeklyTotal ?? 0)} / {formatHours(goal.bankingInfo?.weeklyTarget ?? 0)} this week
                </span>
              ) : (
                <>
                  <span>
                    {formatHours(displayTimeSpent)} / {formatHours(goal.dailyTarget)}
                  </span>
                  <span className="text-gray-600">·</span>
                  <span className={pct >= 100 ? "text-success" : "text-gray-500"}>
                    {Math.round(pct)}%
                  </span>
                </>
              )}
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
            <div className="relative" ref={popoverRef}>
              <button
                onClick={() => { setShowManual((s) => !s); setManualMinutes(""); }}
                className={cn(
                  "p-2 rounded-xl transition-all duration-150",
                  showManual
                    ? "bg-primary/20 text-primary"
                    : "bg-surface-3/50 text-gray-400 hover:text-gray-200"
                )}
              >
                <Plus size={14} />
              </button>

              {/* Floating popover — single compact row */}
              <div
                className={cn(
                  "absolute bottom-[calc(100%-4px)] right-[-6px] z-50",
                  "glass-card rounded-2xl shadow-2xl backdrop-blur-md",
                  "flex items-center gap-1 px-2 py-1.5",
                  "transition-all duration-200 origin-bottom-right",
                  showManual
                    ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 scale-75 translate-y-4 pointer-events-none"
                )}
              >
                <button
                  onClick={() => setManualMinutes(String(Math.max(5, (parseInt(manualMinutes) || 0) - 5)))}
                  className="w-6 h-6 rounded-lg text-secondary hover:text-primary hover:bg-surface-3 transition-all flex items-center justify-center text-base leading-none select-none"
                >−</button>
                <input
                  type="number"
                  min="1"
                  max="480"
                  value={manualMinutes}
                  onChange={(e) => setManualMinutes(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleManualAdd(); if (e.key === "Escape") setShowManual(false); }}
                  placeholder="30"
                  autoFocus={showManual}
                  className="w-10 bg-surface-2 border border-surface-3 rounded-lg text-center text-sm font-semibold text-primary placeholder:text-secondary/40 focus:outline-none focus:border-primary/60 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none py-0.5"
                />
                <button
                  onClick={() => setManualMinutes(String((parseInt(manualMinutes) || 0) + 5))}
                  className="w-6 h-6 rounded-lg text-secondary hover:text-primary hover:bg-surface-3 transition-all flex items-center justify-center text-base leading-none select-none"
                >+</button>
                <div className="w-px h-4 bg-surface-3 mx-0.5" />
                <button
                  onClick={handleManualAdd}
                  className="px-2.5 py-1 rounded-xl bg-primary/90 hover:bg-primary text-white text-xs font-semibold transition-all duration-150 whitespace-nowrap"
                >
                  Add
                </button>
              </div>
            </div>
            {displayCurrentStep && (
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
