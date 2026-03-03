import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLast30Days, getLast7Days } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "daily_scores";
  const period = searchParams.get("period") ?? "month";

  const dates = period === "week" ? getLast7Days() : getLast30Days();
  const from = dates[0];
  const to = dates[dates.length - 1];

  if (type === "daily_scores") {
    const scores = await prisma.dailyScore.findMany({
      where: { date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
    });
    const dateMap = new Map(scores.map((s: any) => [s.date, s.score]));
    return NextResponse.json(
      dates.map((d) => ({ date: d, score: dateMap.get(d) ?? 0 }))
    );
  }

  if (type === "hours_by_goal") {
    const logs = await prisma.dailyLog.findMany({
      where: { date: { gte: from, lte: to } },
      include: { goal: { select: { name: true, emoji: true } } },
    });
    const byDate: Record<string, Record<string, number>> = {};
    for (const log of logs) {
      if (!byDate[log.date]) byDate[log.date] = {};
      byDate[log.date][`${log.goal.emoji} ${log.goal.name}`] = log.timeSpent;
    }
    return NextResponse.json(
      dates.map((d) => ({ date: d, ...(byDate[d] ?? {}) }))
    );
  }

  if (type === "category_breakdown") {
    const logs = await prisma.dailyLog.findMany({
      where: { date: { gte: from, lte: to } },
      include: { goal: { select: { category: true } } },
    });
    const byCategory: Record<string, number> = {};
    for (const log of logs) {
      byCategory[log.goal.category] =
        (byCategory[log.goal.category] ?? 0) + log.timeSpent;
    }
    return NextResponse.json(
      Object.entries(byCategory).map(([name, value]) => ({
        name,
        value: Math.round(value * 10) / 10,
      }))
    );
  }

  return NextResponse.json([]);
}
