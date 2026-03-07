import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLast30Days, getLast7Days } from "@/lib/utils";
import { withApiHandler } from "@/lib/api";

export const GET = withApiHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "month";

  const dates = period === "week" ? getLast7Days() : getLast30Days();
  const from = dates[0];
  const to = dates[dates.length - 1];

  const [scores, logs, overallStreak] = await Promise.all([
    prisma.dailyScore.findMany({
      where: { date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
    }),
    prisma.dailyLog.findMany({ where: { date: { gte: from, lte: to } } }),
    prisma.streak.findFirst({ where: { goalId: null } }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalHours = logs.reduce((s: number, l: any) => s + l.timeSpent, 0);
  const avgScore =
    scores.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? scores.reduce((s: number, sc: any) => s + sc.score, 0) / scores.length
      : 0;
  const bestDay =
    scores.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? scores.reduce((best: any, s: any) => (s.score > best.score ? s : best), scores[0])
      : null;
  const daysWithActivity = new Set(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logs.filter((l: any) => l.timeSpent > 0 || l.completed).map((l: any) => l.date)
  ).size;
  const consistencyRate =
    dates.length > 0
      ? Math.round((daysWithActivity / dates.length) * 100)
      : 0;

  return NextResponse.json({
    totalHours: Math.round(totalHours * 10) / 10,
    averageScore: Math.round(avgScore),
    bestDay: bestDay ? { date: bestDay.date, score: bestDay.score } : null,
    consistencyRate,
    currentOverallStreak: overallStreak?.currentStreak ?? 0,
    topCategory: null,
    period,
  });
});
