// ── Dashboard Data Assembly ──────────────────────────────────────────────
//
// Single source of truth for building the DashboardData object.
// Used by both the API route (GET /api/dashboard) and the server-rendered page.

import { prisma } from "@/lib/db";
import { todayString, isGoalActiveOnDate } from "@/lib/utils";
import { calculateDailyScore } from "@/lib/scoring";
import type { DashboardData } from "@/types";
import { persistDailyScore } from "@/lib/scoring-server";

export async function assembleDashboardData(date?: string): Promise<DashboardData> {
  const d = date ?? todayString();

  const yesterday = (() => {
    const dt = new Date(d + "T00:00:00");
    dt.setDate(dt.getDate() - 1);
    return dt.toISOString().slice(0, 10);
  })();

  const [goals, overallStreakRecord, yesterdayScore, pointsAggregate] =
    await Promise.all([
      prisma.goal.findMany({
        where: { isArchived: false },
        orderBy: { sortOrder: "asc" },
        include: {
          dailyLogs: { where: { date: d } },
          streaks: true,
          timerSessions: { where: { isActive: true } },
        },
      }),
      prisma.streak.findFirst({ where: { goalId: null } }),
      prisma.dailyScore.findUnique({ where: { date: yesterday } }),
      prisma.pointsLedger.aggregate({ _sum: { amount: true } }),
    ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const goalsWithProgress = goals.map((goal: any) => {
    const log = goal.dailyLogs[0] ?? null;
    const streak = goal.streaks[0] ?? { id: "", currentStreak: 0, longestStreak: 0 };
    const activeSession = goal.timerSessions[0] ?? null;
    const isActiveToday = isGoalActiveOnDate(goal.activeDays, d);

    let completionPercentage = 0;
    if (goal.goalType === "checkbox") {
      completionPercentage = log?.completed ? 100 : 0;
    } else if (goal.dailyTarget > 0) {
      completionPercentage = Math.min(
        120,
        ((log?.timeSpent ?? 0) / goal.dailyTarget) * 100
      );
    }

    return {
      id: goal.id,
      name: goal.name,
      emoji: goal.emoji,
      category: goal.category,
      goalType: goal.goalType,
      dailyTarget: goal.dailyTarget,
      priority: goal.priority,
      activeDays: goal.activeDays,
      pomodoroSettings: goal.pomodoroSettings,
      description: goal.description,
      motivation: goal.motivation,
      sortOrder: goal.sortOrder,
      isArchived: goal.isArchived,
      todayLog: log
        ? {
            id: log.id,
            completed: log.completed,
            timeSpent: log.timeSpent,
            focusRating: log.focusRating,
            note: log.note,
          }
        : null,
      streak: {
        id: streak.id,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
      },
      activeSession: activeSession
        ? {
            id: activeSession.id,
            startTime: activeSession.startTime.toISOString(),
            goalId: activeSession.goalId,
          }
        : null,
      completionPercentage: Math.round(completionPercentage),
      isActiveToday,
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scoreInput = {
    goals: goalsWithProgress
      .filter((g: any) => g.isActiveToday)
      .map((g: any) => ({
        goalType: g.goalType as "timer" | "checkbox",
        dailyTarget: g.dailyTarget,
        priority: g.priority,
        isActiveToday: g.isActiveToday,
        timeSpent: g.todayLog?.timeSpent ?? 0,
        completed: g.todayLog?.completed ?? false,
      })),
    activeGoalStreaks: goalsWithProgress.filter((g: any) => g.streak.currentStreak > 0).length,
    overallStreakActive: (overallStreakRecord?.currentStreak ?? 0) > 0,
  };

  const scoreResult = calculateDailyScore(scoreInput);

  // Persist today's score so charts and stats have historical data
  await persistDailyScore(d);

  return {
    goals: goalsWithProgress,
    dailyScore: {
      score: scoreResult.score,
      goalsCompleted: scoreResult.goalsCompleted,
      goalsTotal: scoreResult.goalsTotal,
      totalHours: scoreResult.totalHours,
      targetHours: scoreResult.targetHours,
      streakBonus: scoreResult.breakdown.streakBonus,
    },
    overallStreak: {
      currentStreak: overallStreakRecord?.currentStreak ?? 0,
      longestStreak: overallStreakRecord?.longestStreak ?? 0,
    },
    yesterdayScore: yesterdayScore?.score ?? null,
    totalPoints: pointsAggregate._sum?.amount ?? 0,
    date: d,
  };
}
