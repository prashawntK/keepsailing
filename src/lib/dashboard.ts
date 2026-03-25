// ── Dashboard Data Assembly ──────────────────────────────────────────────
//
// Single source of truth for building the DashboardData object.
// Used by both the API route (GET /api/dashboard) and the server-rendered page.

import { prisma } from "@/lib/db";
import { todayString, isGoalActiveOnDate } from "@/lib/utils";
import { calculateDailyScore } from "@/lib/scoring";
import type { DashboardData, ChoreWithStatus } from "@/types";
import { persistDailyScore } from "@/lib/scoring-server";
import { getWeekDatesRange, getWeeklyBankingStatus } from "@/lib/banking";

export async function assembleDashboardData(date?: string, userId?: string | null): Promise<DashboardData> {
  const d = date ?? todayString();

  const yesterday = (() => {
    const dt = new Date(d + "T00:00:00");
    dt.setDate(dt.getDate() - 1);
    return dt.toISOString().slice(0, 10);
  })();

  const weekDates = getWeekDatesRange(d);

  const [goals, overallStreakRecord, yesterdayScore, pointsAggregate, ecItems, ecTodayLogs, choreItems, weeklyLogs, userRecord] =
    await Promise.all([
      prisma.goal.findMany({
        where: { isArchived: false, ...(userId ? { userId } : {}) },
        orderBy: { sortOrder: "asc" },
        include: {
          dailyLogs: { where: { date: d } },
          streaks: true,
          timerSessions: { where: { isActive: true } },
          steps: { orderBy: { sortOrder: "asc" } },
        },
      }),
      prisma.streak.findFirst({ where: { goalId: null, ...(userId ? { userId } : {}) } }),
      prisma.dailyScore.findFirst({ where: { date: yesterday, ...(userId ? { userId } : {}) } }),
      prisma.pointsLedger.aggregate({
        _sum: { amount: true },
        where: { ...(userId ? { userId } : {}) },
      }),
      prisma.extraCurricular.findMany({
        where: { isArchived: false, ...(userId ? { userId } : {}) },
        orderBy: { sortOrder: "asc" },
        include: {
          logs: {
            where: { completed: true },
            orderBy: { date: "desc" },
            take: 1,
          },
          timeLogs: { select: { minutesSpent: true } },
        },
      }),
      prisma.extraCurricularLog.findMany({
        where: { date: d, completed: true, ...(userId ? { userId } : {}) },
      }),
      prisma.chore.findMany({
        where: { isArchived: false, ...(userId ? { userId } : {}) },
        orderBy: [{ deadline: "asc" }, { sortOrder: "asc" }],
        include: {
          timeLogs: { select: { minutesSpent: true, date: true } },
          completionLogs: {
            where: { date: d, completed: true },
            take: 1,
          },
        },
      }),
      prisma.dailyLog.findMany({
        where: { date: { in: weekDates }, ...(userId ? { userId } : {}) },
        select: { goalId: true, date: true, timeSpent: true },
      }),
      userId
        ? prisma.user.findUnique({ where: { id: userId }, select: { name: true, onboardingCompleted: true } })
        : null,
    ]);

  // Group weekly logs by goalId for banking calculations
  const weeklyLogsByGoal = new Map<string, Array<{ date: string; timeSpent: number }>>();
  for (const l of weeklyLogs) {
    const existing = weeklyLogsByGoal.get(l.goalId) ?? [];
    existing.push({ date: l.date, timeSpent: l.timeSpent });
    weeklyLogsByGoal.set(l.goalId, existing);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const goalsWithProgress = goals.map((goal: any) => {
    const log = goal.dailyLogs[0] ?? null;
    const streak = goal.streaks[0] ?? { id: "", currentStreak: 0, longestStreak: 0 };
    const activeSession = goal.timerSessions[0] ?? null;
    const isActiveToday = isGoalActiveOnDate(goal.activeDays, d);
    const activeDays = Array.isArray(goal.activeDays)
      ? goal.activeDays
      : JSON.parse(goal.activeDays ?? "[]");

    const bankingStatus = getWeeklyBankingStatus(
      goal.goalType,
      goal.dailyTarget,
      activeDays,
      d,
      weeklyLogsByGoal.get(goal.id) ?? []
    );

    let completionPercentage = 0;
    if (bankingStatus.isBanked) {
      completionPercentage = 100;
    } else if (goal.goalType === "checkbox") {
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
      isBanked: bankingStatus.isBanked,
      bankingInfo: bankingStatus.weeklyTarget > 0
        ? { weeklyTotal: bankingStatus.weeklyTotal, weeklyTarget: bankingStatus.weeklyTarget }
        : null,
      steps: (goal.steps ?? []).map((s: any) => ({
        id: s.id,
        name: s.name,
        sortOrder: s.sortOrder,
        completedAt: s.completedAt?.toISOString() ?? null,
      })),
      currentStep: (() => {
        const s = (goal.steps ?? []).find((s: any) => s.completedAt === null);
        return s ? { id: s.id, name: s.name, sortOrder: s.sortOrder, completedAt: null } : null;
      })(),
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
        isBanked: g.isBanked,
      })),
    activeGoalStreaks: goalsWithProgress.filter((g: any) => g.streak.currentStreak > 0).length,
    overallStreakActive: (overallStreakRecord?.currentStreak ?? 0) > 0,
  };

  const scoreResult = calculateDailyScore(scoreInput);

  // ── Extra-curriculars with staleness ──────────────────────────────────
  const ecTodaySet = new Set(ecTodayLogs.map((l) => l.extraCurricularId));
  const todayDate = new Date(d + "T00:00:00");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extraCurriculars = ecItems.map((ec: any) => {
    const lastLog = ec.logs[0];
    const lastPerformedDate = lastLog?.date ?? null;
    let lastPerformedDaysAgo: number | null = null;

    if (lastPerformedDate) {
      const diff = todayDate.getTime() - new Date(lastPerformedDate + "T00:00:00").getTime();
      lastPerformedDaysAgo = Math.round(diff / (1000 * 60 * 60 * 24));
    }

    const totalMinutesSpent = (ec.timeLogs ?? []).reduce(
      (sum: number, l: { minutesSpent: number }) => sum + l.minutesSpent,
      0
    );

    return {
      id: ec.id,
      name: ec.name,
      emoji: ec.emoji,
      sortOrder: ec.sortOrder,
      isArchived: ec.isArchived,
      targetMinutes: ec.targetMinutes ?? null,
      completedToday: ecTodaySet.has(ec.id),
      lastPerformedDate,
      lastPerformedDaysAgo,
      totalMinutesSpent,
    };
  });

  // ── Chores with deadline urgency ─────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chores: ChoreWithStatus[] = choreItems.map((chore: any) => {
    const deadlineDate = new Date(chore.deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffMs = deadlineDate.getTime() - todayDate.getTime();
    const daysUntilDeadline = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const totalMinutesSpent = chore.timeLogs.reduce(
      (sum: number, l: { minutesSpent: number }) => sum + l.minutesSpent,
      0
    );
    const completedToday = chore.completionLogs.length > 0;

    let deadlineLabel: string;
    let deadlineSeverity: ChoreWithStatus["deadlineSeverity"];

    if (daysUntilDeadline < 0) {
      deadlineLabel = "overdue!";
      deadlineSeverity = "overdue";
    } else if (daysUntilDeadline === 0) {
      deadlineLabel = "today!";
      deadlineSeverity = "today";
    } else if (daysUntilDeadline === 1) {
      deadlineLabel = "tomorrow";
      deadlineSeverity = "urgent";
    } else if (daysUntilDeadline <= 3) {
      deadlineLabel = `${daysUntilDeadline} days left`;
      deadlineSeverity = "urgent";
    } else if (daysUntilDeadline <= 7) {
      deadlineLabel = `${daysUntilDeadline} days left`;
      deadlineSeverity = "warning";
    } else if (daysUntilDeadline <= 14) {
      deadlineLabel = `${Math.ceil(daysUntilDeadline / 7)} weeks left`;
      deadlineSeverity = "comfortable";
    } else {
      deadlineLabel = `${Math.ceil(daysUntilDeadline / 7)} weeks left`;
      deadlineSeverity = "relaxed";
    }

    return {
      id: chore.id,
      name: chore.name,
      emoji: chore.emoji,
      deadline: chore.deadline.toISOString(),
      estimatedMinutes: chore.estimatedMinutes,
      description: chore.description,
      sortOrder: chore.sortOrder,
      isArchived: chore.isArchived,
      completedToday,
      totalMinutesSpent,
      daysUntilDeadline,
      deadlineLabel,
      deadlineSeverity,
    };
  });

  // Persist today's score so charts and stats have historical data
  await persistDailyScore(d, userId ?? undefined);

  return {
    goals: goalsWithProgress,
    extraCurriculars,
    chores,
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
    user: userRecord ? { name: userRecord.name, onboardingCompleted: userRecord.onboardingCompleted } : null,
  };
}
