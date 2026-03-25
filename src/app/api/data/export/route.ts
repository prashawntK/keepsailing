import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withApiHandler, getAuthUserId } from "@/lib/api";
import { PLAN_LIMITS } from "@/lib/plan";

export const GET = withApiHandler(async () => {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  const plan = (user?.plan ?? "free") as "free" | "pro";
  if (!PLAN_LIMITS[plan].exportEnabled) {
    return NextResponse.json(
      { error: "Data export requires a Pro plan. Upgrade to access this feature.", code: "PLAN_LIMIT" },
      { status: 403 }
    );
  }

  const [goals, dailyLogs, timerSessions, streaks, dailyScores, rewards, journal, energy, extraCurriculars, extraCurricularLogs, extraCurricularTimeLogs, chores, choreTimeLogs, choreCompletionLogs] =
    await Promise.all([
      prisma.goal.findMany({ where: { userId } }),
      prisma.dailyLog.findMany({ where: { userId }, orderBy: { date: "desc" } }),
      prisma.timerSession.findMany({ where: { userId }, orderBy: { startTime: "desc" } }),
      prisma.streak.findMany({ where: { userId } }),
      prisma.dailyScore.findMany({ where: { userId }, orderBy: { date: "desc" } }),
      prisma.reward.findMany({ where: { userId } }),
      prisma.journalEntry.findMany({ where: { userId }, orderBy: { date: "desc" } }),
      prisma.energyLog.findMany({ where: { userId }, orderBy: { date: "desc" } }),
      prisma.extraCurricular.findMany({ where: { userId } }),
      prisma.extraCurricularLog.findMany({ where: { userId }, orderBy: { date: "desc" } }),
      prisma.extraCurricularTimeLog.findMany({ where: { userId }, orderBy: { date: "desc" } }),
      prisma.chore.findMany({ where: { userId } }),
      prisma.choreTimeLog.findMany({ where: { userId }, orderBy: { date: "desc" } }),
      prisma.choreCompletionLog.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    goals,
    dailyLogs,
    timerSessions,
    streaks,
    dailyScores,
    rewards,
    journal,
    energy,
    extraCurriculars,
    extraCurricularLogs,
    extraCurricularTimeLogs,
    chores,
    choreTimeLogs,
    choreCompletionLogs,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="keepsailing-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
});
