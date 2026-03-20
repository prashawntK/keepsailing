import "server-only";
import { prisma } from "@/lib/db";
import { isGoalActiveOnDate, todayString } from "@/lib/utils";
import { calculateDailyScore, type ScoreGoalInput, type ScoreOutput } from "@/lib/scoring";
import { getWeekDatesRange, getWeeklyBankingStatus } from "@/lib/banking";

/**
 * Lightweight score computation for a given date.
 * Server-only — uses Prisma to fetch goals and compute score.
 */
export async function computeScoreForDate(
  date: string,
  userId?: string
): Promise<ScoreOutput & { overallStreakActive: boolean }> {
  const weekDates = getWeekDatesRange(date);

  const [goals, weeklyLogs] = await Promise.all([
    prisma.goal.findMany({
      where: { isArchived: false, ...(userId ? { userId } : {}) },
      include: { dailyLogs: { where: { date } }, streaks: true },
    }),
    prisma.dailyLog.findMany({
      where: {
        date: { in: weekDates },
        ...(userId ? { userId } : {}),
      },
      select: { goalId: true, date: true, timeSpent: true },
    }),
  ]);

  // Group weekly logs by goalId
  const weeklyLogsByGoal = new Map<string, Array<{ date: string; timeSpent: number }>>();
  for (const l of weeklyLogs) {
    const existing = weeklyLogsByGoal.get(l.goalId) ?? [];
    existing.push({ date: l.date, timeSpent: l.timeSpent });
    weeklyLogsByGoal.set(l.goalId, existing);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scoreGoals: ScoreGoalInput[] = goals.map((g: any) => {
    const log = g.dailyLogs[0];
    const activeDays = Array.isArray(g.activeDays) ? g.activeDays : JSON.parse(g.activeDays ?? "[]");
    const { isBanked } = getWeeklyBankingStatus(
      g.goalType,
      g.dailyTarget,
      activeDays,
      date,
      weeklyLogsByGoal.get(g.id) ?? []
    );
    return {
      goalType: g.goalType as "timer" | "checkbox",
      dailyTarget: g.dailyTarget,
      priority: g.priority,
      isActiveToday: isGoalActiveOnDate(g.activeDays, date),
      timeSpent: log?.timeSpent ?? 0,
      completed: log?.completed ?? false,
      isBanked,
    };
  });

  const activeGoalStreaks = goals.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (g: any) => (g.streaks[0]?.currentStreak ?? 0) > 0
  ).length;

  const overallStreak = await prisma.streak.findFirst({
    where: { goalId: null, ...(userId ? { userId } : {}) },
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
 * Recompute and persist scores for every day in the same week as `date`,
 * from `date` through today. Call this after any time-logging action so that
 * banking changes propagate to subsequent days in the same week.
 */
export async function recomputeWeekScores(date: string, userId?: string): Promise<void> {
  const today = todayString();
  const weekDates = getWeekDatesRange(date);
  for (const d of weekDates) {
    if (d >= date && d <= today) {
      await persistDailyScore(d, userId);
    }
  }
}

/**
 * Compute the score for a date and persist it to the DailyScore table.
 * Fire-and-forget safe — errors are swallowed to avoid breaking callers.
 */
export async function persistDailyScore(date: string, userId?: string): Promise<void> {
  try {
    const result = await computeScoreForDate(date, userId);
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
        ...(userId ? { userId } : {}),
      },
    });
  } catch {
    // Non-critical — don't break the caller if score persistence fails
  }
}
