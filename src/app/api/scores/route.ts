import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { todayString } from "@/lib/utils";
import { computeScoreForDate } from "@/lib/scoring-server";
import { withApiHandler } from "@/lib/api";

export const GET = withApiHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? todayString();
  const to = searchParams.get("to") ?? todayString();
  const fill = searchParams.get("fill") === "true";

  const scores = await prisma.dailyScore.findMany({
    where: { date: { gte: from, lte: to } },
    orderBy: { date: "asc" },
  });

  if (!fill) {
    return NextResponse.json(scores);
  }

  // Fill missing days with score 0 for calendar/chart views
  const scoreMap = new Map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scores.map((s: any) => [s.date, s.score])
  );
  const days: { date: string; score: number }[] = [];
  const current = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");
  while (current <= end) {
    const d = current.toISOString().slice(0, 10);
    days.push({ date: d, score: scoreMap.get(d) ?? 0 });
    current.setDate(current.getDate() + 1);
  }
  return NextResponse.json(days);
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const date = (body as { date?: string }).date ?? todayString();

  const result = await computeScoreForDate(date);

  const score = await prisma.dailyScore.upsert({
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

  return NextResponse.json({ ...score, breakdown: result.breakdown });
});
