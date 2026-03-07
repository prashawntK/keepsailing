import "server-only";
import { prisma } from "@/lib/db";
import { isGoalActiveOnDate } from "@/lib/utils";
import { calculateDailyScore, type ScoreGoalInput, type ScoreOutput } from "@/lib/scoring";

/**
 * Lightweight score computation for a given date.
 * Server-only — uses Prisma to fetch goals and compute score.
 */
export async function computeScoreForDate(
  date: string
): Promise<ScoreOutput & { overallStreakActive: boolean }> {
  const goals = await prisma.goal.findMany({
    where: { isArchived: false },
    include: { dailyLogs: { where: { date } }, streaks: true },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scoreGoals: ScoreGoalInput[] = goals.map((g: any) => {
    const log = g.dailyLogs[0];
    return {
      goalType: g.goalType as "timer" | "checkbox",
      dailyTarget: g.dailyTarget,
      priority: g.priority,
      isActiveToday: isGoalActiveOnDate(g.activeDays, date),
      timeSpent: log?.timeSpent ?? 0,
      completed: log?.completed ?? false,
    };
  });

  const activeGoalStreaks = goals.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (g: any) => (g.streaks[0]?.currentStreak ?? 0) > 0
  ).length;

  const overallStreak = await prisma.streak.findFirst({
    where: { goalId: null },
  });
  const overallStreakActive = (overallStreak?.currentStreak ?? 0) > 0;

  const result = calculateDailyScore({
    goals: scoreGoals,
    activeGoalStreaks,
    overallStreakActive,
  });

  return { ...result, overallStreakActive };
}

/**
 * Compute the score for a date and persist it to the DailyScore table.
 * Fire-and-forget safe — errors are swallowed to avoid breaking callers.
 */
export async function persistDailyScore(date: string): Promise<void> {
  try {
    const result = await computeScoreForDate(date);
    await prisma.dailyScore.upsert({
      where: { date },
      update: {
        score: result.score,
        goalsCompleted: result.goalsCompleted,
        goalsTotal: result.goalsTotal,
        totalHours: result.totalHours,
        targetHours: result.targetHours,
        streakBonus: result.breakdown.streakBonus,
      },
      create: {
        date,
        score: result.score,
        goalsCompleted: result.goalsCompleted,
        goalsTotal: result.goalsTotal,
        totalHours: result.totalHours,
        targetHours: result.targetHours,
        streakBonus: result.breakdown.streakBonus,
      },
    });
  } catch {
    // Non-critical — don't break the caller if score persistence fails
  }
}
