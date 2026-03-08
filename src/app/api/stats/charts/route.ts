import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLast30Days, getLast7Days } from "@/lib/utils";
import { withApiHandler } from "@/lib/api";

export const GET = withApiHandler(async (req: NextRequest) => {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  if (type === "hours_by_step") {
    const goalId = searchParams.get("goalId");
    if (!goalId) return NextResponse.json({ error: "goalId required" }, { status: 400 });

    const sessions = await prisma.timerSession.findMany({
      where: { goalId, date: { gte: from, lte: to }, stepId: { not: null } },
      include: { step: { select: { name: true, sortOrder: true } } },
    });

    const byStep: Record<string, { hours: number; sortOrder: number }> = {};
    for (const session of sessions) {
      const name = session.step?.name ?? "Unknown";
      const sortOrder = session.step?.sortOrder ?? 999;
      if (!byStep[name]) byStep[name] = { hours: 0, sortOrder };
      byStep[name].hours += session.duration;
    }

    if (Object.keys(byStep).length > 0) {
      return NextResponse.json(
        Object.entries(byStep)
          .sort((a, b) => a[1].sortOrder - b[1].sortOrder)
          .map(([name, { hours }]) => ({ name, hours: Math.round(hours * 100) / 100 }))
      );
    }

    // Fallback: goal-level hours from DailyLog
    const logs = await prisma.dailyLog.findMany({
      where: { goalId, date: { gte: from, lte: to }, timeSpent: { gt: 0 } },
    });
    const totalHours = logs.reduce((sum, l) => sum + l.timeSpent, 0);
    if (totalHours === 0) return NextResponse.json([]);
    const goal = await prisma.goal.findUnique({ where: { id: goalId }, select: { name: true } });
    return NextResponse.json([{ name: goal?.name ?? "Total", hours: Math.round(totalHours * 100) / 100 }]);
  }

  return NextResponse.json([]);
});
