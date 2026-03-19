"use client";

import { useState } from "react";
import { Pencil, Archive, RotateCcw, Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn, CATEGORY_COLORS, PRIORITY_LABELS, formatHours } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { GoalForm, type GoalFormData } from "./GoalForm";
import type { Goal } from "@/types";

interface GoalWithSteps extends Goal {
  steps?: { id: string; name: string; sortOrder: number; completedAt: Date | null }[];
}

interface GoalListProps {
  goals: Goal[];
  onRefresh: () => void;
}

export function GoalList({ goals, onRefresh }: GoalListProps) {
  const [editingGoal, setEditingGoal] = useState<GoalWithSteps | null>(null);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());

  function toggleExpand(goalId: string) {
    setExpandedGoals((prev) => {
      const next = new Set(prev);
      next.has(goalId) ? next.delete(goalId) : next.add(goalId);
      return next;
    });
  }

  async function handleEditClick(goal: Goal) {
    // Open modal immediately with existing data, then enrich with full data in background
    setEditingGoal(goal as GoalWithSteps);
    const res = await fetch(`/api/goals/${goal.id}`);
    const full = await res.json();
    setEditingGoal(full);
  }

  async function handleEdit(data: GoalFormData) {
    if (!editingGoal) return;
    await fetch(`/api/goals/${editingGoal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditingGoal(null);
    onRefresh();
  }

  async function handleArchive(goal: Goal) {
    await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
    onRefresh();
  }

  async function handleRestore(goal: Goal) {
    await fetch(`/api/goals/${goal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: false, archivedAt: null }),
    });
    onRefresh();
  }

  if (goals.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-3xl mb-2">🎯</p>
        <p>No goals yet — add your first one!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className={cn(
              "flex items-center gap-3 glass-card px-4 py-3",
              goal.isArchived && "opacity-50"
            )}
          >
            <span className="text-2xl">{goal.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-100 truncate">{goal.name}</p>
              <div className="flex items-center gap-2 mt-0.5 text-xs">
                <span className={CATEGORY_COLORS[goal.category] ?? "text-gray-400"}>
                  {goal.category}
                </span>
                <span className="text-gray-600">·</span>
                <span className="text-gray-500">{PRIORITY_LABELS[goal.priority]}</span>
                {goal.goalType === "timer" && goal.dailyTarget > 0 && (
                  <>
                    <span className="text-gray-600">·</span>
                    <span className="text-gray-500">{formatHours(goal.dailyTarget)}/day</span>
                  </>
                )}
              </div>

              {/* Steps collapse/expand toggle */}
              {(goal as GoalWithSteps).steps && (goal as GoalWithSteps).steps!.length > 0 && (() => {
                const steps = (goal as GoalWithSteps).steps!;
                const doneCount = steps.filter((s) => s.completedAt !== null).length;
                const isExpanded = expandedGoals.has(goal.id);
                return (
                  <div className="mt-1.5">
                    <button
                      type="button"
                      onClick={() => toggleExpand(goal.id)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      <span>
                        {doneCount}/{steps.length} steps
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="mt-1.5 space-y-1 pl-0.5">
                        {steps.map((step) => {
                          const done = step.completedAt !== null;
                          return (
                            <div key={step.id} className="flex items-center gap-1.5">
                              <div className={cn(
                                "w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all",
                                done
                                  ? "bg-success/20 border-success/50"
                                  : "border-gray-700"
                              )}>
                                {done && <Check size={8} className="text-success" />}
                              </div>
                              <span className={cn(
                                "text-xs transition-all",
                                done ? "line-through text-gray-600" : "text-gray-400"
                              )}>
                                {step.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!goal.isArchived ? (
                <>
                  <button
                    onClick={() => handleEditClick(goal)}
                    className="p-2 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-surface-2 cursor-pointer"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleArchive(goal)}
                    className="p-2 rounded-lg text-gray-500 hover:text-streak hover:bg-surface-2 cursor-pointer"
                  >
                    <Archive size={14} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleRestore(goal)}
                  className="p-2 rounded-lg text-gray-500 hover:text-success hover:bg-surface-2 cursor-pointer"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!editingGoal}
        onClose={() => setEditingGoal(null)}
        title="Edit Goal"
      >
        {editingGoal && (
          <GoalForm
            initial={{
              name: editingGoal.name,
              emoji: editingGoal.emoji,
              category: editingGoal.category,
              goalType: editingGoal.goalType as "timer" | "checkbox",
              dailyTarget: editingGoal.dailyTarget,
              priority: editingGoal.priority as "must" | "should" | "want",
              activeDays: Array.isArray(editingGoal.activeDays)
                ? (editingGoal.activeDays as number[])
                : [0, 1, 2, 3, 4, 5, 6],
              description: editingGoal.description ?? "",
              motivation: editingGoal.motivation ?? "",
              steps: (editingGoal.steps ?? []).map((s) => ({
                id: s.id,
                name: s.name,
                completedAt: s.completedAt instanceof Date
                  ? s.completedAt.toISOString()
                  : s.completedAt ?? null,
              })),
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditingGoal(null)}
            submitLabel="Update Goal"
          />
        )}
      </Modal>
    </>
  );
}
