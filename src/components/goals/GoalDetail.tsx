"use client";

import { Check } from "lucide-react";
import { format } from "date-fns";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import type { GoalWithProgress } from "@/types";

interface GoalDetailProps {
  goal: GoalWithProgress;
  onClose: () => void;
  onRefresh: () => void;
}

export function GoalDetail({ goal, onClose, onRefresh }: GoalDetailProps) {
  if (goal.steps.length === 0) return null;

  async function handleUncomplete(stepId: string) {
    await fetch("/api/steps/uncomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepId }),
    });
    onRefresh();
    onClose();
  }

  async function handleCompleteStep(stepId: string) {
    try {
      const res = await fetch("/api/steps/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId }),
      });
      if (!res.ok) return;
      onRefresh();
      onClose();
    } catch {
      // silent
    }
  }

  const completedCount = goal.steps.filter((s) => s.completedAt !== null).length;

  return (
    <Modal
      open
      onClose={onClose}
      title={`${goal.emoji} ${goal.name}`}
    >
      <div className="space-y-4">
        {/* Progress summary */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>{completedCount} of {goal.steps.length} steps completed</span>
          {completedCount === goal.steps.length && (
            <span className="text-xs bg-success/15 text-success px-2 py-0.5 rounded-full">All done!</span>
          )}
        </div>

        {/* Steps list */}
        <div className="space-y-1.5">
          {goal.steps.map((step) => {
            const isCurrent = goal.currentStep?.id === step.id;
            const isCompleted = step.completedAt !== null;

            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all",
                  isCurrent && "bg-primary/10 border border-primary/25",
                  isCompleted && !isCurrent && "opacity-60",
                  !isCurrent && !isCompleted && "opacity-40 bg-surface-2/30"
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted ? (
                    <button
                      onClick={() => handleUncomplete(step.id)}
                      title="Undo completion"
                      className="w-5 h-5 rounded-full bg-success/20 border border-success/40 flex items-center justify-center hover:bg-error/20 hover:border-error/40 transition-all group"
                    >
                      <Check size={11} className="text-success group-hover:text-error" />
                    </button>
                  ) : (
                    <span className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center text-xs font-medium",
                      isCurrent ? "border-primary/50 text-primary-light" : "border-gray-700 text-gray-600"
                    )}>
                      {step.sortOrder + 1}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "text-sm",
                    isCompleted ? "line-through text-gray-500" : isCurrent ? "text-gray-100" : "text-gray-500"
                  )}>
                    {step.name}
                  </span>
                  {isCompleted && step.completedAt && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      Completed {format(new Date(step.completedAt), "MMM d")}
                    </p>
                  )}
                </div>

                {isCurrent && (
                  <button
                    onClick={() => handleCompleteStep(step.id)}
                    className="text-xs bg-success/15 text-success hover:bg-success/25 px-2.5 py-1 rounded-full flex-shrink-0 transition-all font-medium"
                  >
                    Complete ✓
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {goal.description && (
          <p className="text-xs text-gray-500 border-t border-white/[0.06] pt-3">{goal.description}</p>
        )}
      </div>
    </Modal>
  );
}
