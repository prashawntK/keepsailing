// ── Daily Score Calculation ───────────────────────────────────────────────
//
// Score out of 100:
//   1. Goal Completion  0-60 pts  (priority-weighted)
//   2. Time Investment  0-25 pts  (total hours vs target)
//   3. Streak Bonus     0-15 pts  (per-goal + overall)
//

export const PRIORITY_WEIGHTS: Record<string, number> = {
  must: 3,
  should: 2,
  want: 1,
};

export interface ScoreGoalInput {
  goalType: "timer" | "checkbox";
  dailyTarget: number;
  priority: string;
  isActiveToday: boolean;
  timeSpent: number;
  completed: boolean;
  isBanked?: boolean; // weekly target already met — counts as fully completed
}

export interface ScoreInput {
  goals: ScoreGoalInput[];
  activeGoalStreaks: number; // count of goals with currentStreak > 0
  overallStreakActive: boolean;
}

export interface ScoreOutput {
  score: number;
  breakdown: {
    goalCompletion: number; // 0-60
    timeInvestment: number; // 0-25
    streakBonus: number;    // 0-15
  };
  goalsCompleted: number;
  goalsTotal: number;
  totalHours: number;
  targetHours: number;
}

export function calculateDailyScore(input: ScoreInput): ScoreOutput {
  const activeGoals = input.goals.filter((g) => g.isActiveToday);

  if (activeGoals.length === 0) {
    return {
      score: 100,
      breakdown: { goalCompletion: 60, timeInvestment: 25, streakBonus: 15 },
      goalsCompleted: 0,
      goalsTotal: 0,
      totalHours: 0,
      targetHours: 0,
    };
  }

  // 1. Goal Completion (0-60)
  const totalWeight = activeGoals.reduce(
    (sum, g) => sum + (PRIORITY_WEIGHTS[g.priority] ?? 1),
    0
  );

  let goalCompletionRaw = 0;
  let goalsCompleted = 0;

  for (const goal of activeGoals) {
    const weight = PRIORITY_WEIGHTS[goal.priority] ?? 1;
    let completion = 0;

    if (goal.isBanked) {
      // Weekly target already met — full credit, no over-achievement bonus
      completion = 1;
    } else if (goal.goalType === "checkbox") {
      completion = goal.completed ? 1 : 0;
    } else {
      completion =
        goal.dailyTarget > 0
          ? Math.min(1.2, goal.timeSpent / goal.dailyTarget)
          : goal.timeSpent > 0
          ? 1
          : 0;
    }

    if (completion >= 1) goalsCompleted++;
    goalCompletionRaw += (completion * weight) / totalWeight;
  }

  const goalCompletion = Math.min(60, Math.round(goalCompletionRaw * 60));

  // 2. Time Investment (0-25)
  // Banked goals contribute their dailyTarget to both sides → ratio = 1.0 for that goal
  const totalHours = activeGoals.reduce(
    (sum, g) => sum + (g.isBanked ? g.dailyTarget : g.timeSpent),
    0
  );
  const targetHours = activeGoals
    .filter((g) => g.goalType === "timer")
    .reduce((sum, g) => sum + g.dailyTarget, 0);

  const timeInvestment =
    targetHours > 0
      ? Math.min(25, Math.round((totalHours / targetHours) * 25))
      : 25;

  // 3. Streak Bonus (0-15)
  const goalStreakBonus = Math.min(10, input.activeGoalStreaks * 2);
  const overallBonus = input.overallStreakActive ? 5 : 0;
  const streakBonus = goalStreakBonus + overallBonus;

  const score = Math.min(100, goalCompletion + timeInvestment + streakBonus);

  return {
    score,
    breakdown: { goalCompletion, timeInvestment, streakBonus },
    goalsCompleted,
    goalsTotal: activeGoals.length,
    totalHours: Math.round(totalHours * 100) / 100,
    targetHours: Math.round(targetHours * 100) / 100,
  };
}

export function getLetterGrade(averageScore: number): string {
  if (averageScore >= 95) return "A+";
  if (averageScore >= 90) return "A";
  if (averageScore >= 85) return "A-";
  if (averageScore >= 80) return "B+";
  if (averageScore >= 75) return "B";
  if (averageScore >= 70) return "B-";
  if (averageScore >= 65) return "C+";
  if (averageScore >= 60) return "C";
  if (averageScore >= 55) return "C-";
  if (averageScore >= 50) return "D";
  return "F";
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return "Legendary 🏆";
  if (score >= 80) return "Crushing it 🔥";
  if (score >= 70) return "Solid day ✅";
  if (score >= 50) return "Making progress 📈";
  if (score >= 30) return "Slow start 🌱";
  return "Let's go! 🚀";
}
