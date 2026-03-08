"use client";

import { useState } from "react";
import { Shuffle, Play } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useTimer } from "@/components/providers/TimerProvider";
import type { GoalWithProgress } from "@/types";

interface DecisionHelperProps {
  goals: GoalWithProgress[];
  energyLevel: number | null;
  onStartTimer: () => void;
}

interface ScoredGoal {
  goal: GoalWithProgress;
  score: number;
  reasons: string[];
}

function rankGoals(goals: GoalWithProgress[], energyLevel: number | null): ScoredGoal[] {
  const activeIncomplete = goals.filter(
    (g) => g.isActiveToday && g.completionPercentage < 100
  );

  return activeIncomplete
    .map((goal) => {
      let score = 0;
      const reasons: string[] = [];

      // Priority (0-40)
      if (goal.priority === "must") { score += 40; reasons.push("High priority"); }
      else if (goal.priority === "should") { score += 25; }
      else { score += 10; }

      // Behind schedule (0-30)
      const behind = 100 - goal.completionPercentage;
      score += Math.min(30, behind * 0.3);
      if (behind > 70 && goal.goalType === "timer") reasons.push("Falling behind today");

      // Streak protection (0-20)
      if (goal.streak.currentStreak > 0 && goal.completionPercentage < 10) {
        score += 20;
        reasons.push(`Protect your ${goal.streak.currentStreak}-day streak!`);
      }

      // Energy match (0-10)
      if (energyLevel !== null) {
        const isLight = goal.goalType === "checkbox" || goal.dailyTarget <= 0.5;
        const isHeavy = goal.dailyTarget >= 1.5;
        if (energyLevel <= 2 && isLight) {
          score += 10;
          reasons.push("Good match for low energy");
        }
        if (energyLevel >= 4 && isHeavy) {
          score += 10;
          reasons.push("You have the energy for this!");
        }
      }

      // Novelty bump (0-5)
      score += Math.random() * 5;

      return { goal, score: Math.round(score), reasons };
    })
    .sort((a, b) => b.score - a.score);
}

export function DecisionHelper({ goals, energyLevel, onStartTimer }: DecisionHelperProps) {
  const [open, setOpen] = useState(false);
  const [ranked, setRanked] = useState<ScoredGoal[]>([]);
  const { startTimer } = useTimer();

  function handleOpen() {
    setRanked(rankGoals(goals, energyLevel));
    setOpen(true);
  }

  function handleShuffle() {
    setRanked(rankGoals(goals, energyLevel));
  }

  async function handlePick(goalId: string) {
    setOpen(false);
    await startTimer(goalId);
    onStartTimer();
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="w-full py-3 bg-primary/15 border border-primary/30 hover:bg-primary/25 text-primary-light rounded-2xl text-sm font-semibold transition-all"
      >
        🤔 What should I work on?
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="What to work on?">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Based on your priorities and progress:
          </p>

          {ranked.slice(0, 3).map((item, i) => (
            <div
              key={item.goal.id}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:border-primary/50 ${
                i === 0
                  ? "border-primary/30 bg-primary/10"
                  : "border-white/[0.06] bg-surface-2/50"
              }`}
              onClick={() => handlePick(item.goal.id)}
            >
              <span className="text-xl mt-0.5">{item.goal.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {i === 0 && <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">Top pick</span>}
                  <span className="font-medium text-gray-100">{item.goal.name}</span>
                </div>
                {item.goal.currentStep && (
                  <p className="text-xs text-primary-light/70 mt-0.5">→ {item.goal.currentStep.name}</p>
                )}
                {item.reasons.length > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">{item.reasons.join(" · ")}</p>
                )}
              </div>
              <Play size={16} className="text-gray-500 flex-shrink-0 mt-1" />
            </div>
          ))}

          {ranked.length === 0 && (
            <p className="text-center text-gray-500 py-4">All goals completed today! 🎉</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleShuffle}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] text-gray-400 hover:text-gray-200 text-sm transition-all"
            >
              <Shuffle size={14} /> Shuffle
            </button>
            <button
              onClick={() => setOpen(false)}
              className="flex-1 py-2 text-sm text-gray-500 hover:text-gray-300"
            >
              I'll decide myself
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
