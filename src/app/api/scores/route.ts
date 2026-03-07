import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { todayString } from "@/lib/utils";
import { computeScoreForDate } from "@/lib/scoring-server";
import { withApiHandler } from "@/lib/api";

export const GET = withApiHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? todayString();
  const to = searchParams.get("to") ?? todayString();

  const scores = await prisma.dailyScore.findMany({
    where: { date: { gte: from, lte: to } },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(scores);
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
