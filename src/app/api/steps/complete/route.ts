import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { todayString } from "@/lib/utils";
import { withApiHandler } from "@/lib/api";
import { persistDailyScore } from "@/lib/scoring-server";

export const POST = withApiHandler(async (req: NextRequest) => {
  const { stepId } = await req.json();

  const step = await prisma.step.findUnique({ where: { id: stepId } });
  if (!step) return NextResponse.json({ error: "Step not found" }, { status: 404 });
  if (step.completedAt) return NextResponse.json({ error: "Step already completed" }, { status: 400 });

  await prisma.step.update({
    where: { id: stepId },
    data: { completedAt: new Date() },
  });

  const date = todayString();
  const remainingCount = await prisma.step.count({
    where: { goalId: step.goalId, completedAt: null },
  });

  const goal = await prisma.goal.findUnique({ where: { id: step.goalId } });
  const log = await prisma.dailyLog.upsert({
    where: { goalId_date: { goalId: step.goalId, date } },
    update: { completed: remainingCount === 0 },
    create: {
      goalId: step.goalId,
      date,
      completed: remainingCount === 0,
      targetAtTime: goal?.dailyTarget ?? 0,
    },
  });

  await persistDailyScore(date);

  return NextResponse.json({ log, remainingSteps: remainingCount });
});
