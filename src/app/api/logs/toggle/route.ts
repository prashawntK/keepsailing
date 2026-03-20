import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { todayString } from "@/lib/utils";
import { withApiHandler, getAuthUserId } from "@/lib/api";
import { recomputeWeekScores } from "@/lib/scoring-server";

export const POST = withApiHandler(async (req: NextRequest) => {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { goalId, date } = await req.json();
  const logDate = date ?? todayString();

  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { steps: { orderBy: { sortOrder: "asc" } } },
  });
  if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  const hasSteps = goal.steps.length > 0;

  if (hasSteps) {
    const currentStep = goal.steps.find((s) => s.completedAt === null) ?? null;

    if (currentStep) {
      // Complete the current step
      await prisma.step.update({
        where: { id: currentStep.id },
        data: { completedAt: new Date() },
      });
      const remainingCount = await prisma.step.count({ where: { goalId, completedAt: null } });
      const log = await prisma.dailyLog.upsert({
        where: { goalId_date: { goalId, date: logDate } },
        update: { completed: remainingCount === 0 },
        create: { goalId, date: logDate, completed: remainingCount === 0, targetAtTime: goal.dailyTarget, userId },
      });
      recomputeWeekScores(logDate, userId).catch(console.error);
      return NextResponse.json(log);
    } else {
      // All steps done — toggling reverts the last completed step
      const lastCompleted = await prisma.step.findFirst({
        where: { goalId, completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
      });
      if (lastCompleted) {
        await prisma.step.update({ where: { id: lastCompleted.id }, data: { completedAt: null } });
      }
      const log = await prisma.dailyLog.upsert({
        where: { goalId_date: { goalId, date: logDate } },
        update: { completed: false },
        create: { goalId, date: logDate, completed: false, targetAtTime: goal.dailyTarget, userId },
      });
      recomputeWeekScores(logDate, userId).catch(console.error);
      return NextResponse.json(log);
    }
  }

  // No steps — simple toggle
  const existing = await prisma.dailyLog.findUnique({
    where: { goalId_date: { goalId, date: logDate } },
  });
  const newCompleted = !existing?.completed;
  const log = await prisma.dailyLog.upsert({
    where: { goalId_date: { goalId, date: logDate } },
    update: { completed: newCompleted },
    create: { goalId, date: logDate, completed: newCompleted, targetAtTime: goal.dailyTarget, userId },
  });
  await recomputeWeekScores(logDate, userId);
  return NextResponse.json(log);
});
