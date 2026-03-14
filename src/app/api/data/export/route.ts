import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withApiHandler } from "@/lib/api";

export const GET = withApiHandler(async () => {
  const [goals, dailyLogs, timerSessions, streaks, dailyScores, rewards, journal, energy, extraCurriculars, extraCurricularLogs, extraCurricularTimeLogs, chores, choreTimeLogs, choreCompletionLogs] =
    await Promise.all([
      prisma.goal.findMany(),
      prisma.dailyLog.findMany({ orderBy: { date: "desc" } }),
      prisma.timerSession.findMany({ orderBy: { startTime: "desc" } }),
      prisma.streak.findMany(),
      prisma.dailyScore.findMany({ orderBy: { date: "desc" } }),
      prisma.reward.findMany(),
      prisma.journalEntry.findMany({ orderBy: { date: "desc" } }),
      prisma.energyLog.findMany({ orderBy: { date: "desc" } }),
      prisma.extraCurricular.findMany(),
      prisma.extraCurricularLog.findMany({ orderBy: { date: "desc" } }),
      prisma.extraCurricularTimeLog.findMany({ orderBy: { date: "desc" } }),
      prisma.chore.findMany(),
      prisma.choreTimeLog.findMany({ orderBy: { date: "desc" } }),
      prisma.choreCompletionLog.findMany({ orderBy: { date: "desc" } }),
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
      "Content-Disposition": `attachment; filename="adhd-scorecard-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
});
