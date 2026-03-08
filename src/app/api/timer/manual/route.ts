import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { todayString } from "@/lib/utils";
import { withApiHandler } from "@/lib/api";
import { persistDailyScore } from "@/lib/scoring-server";

export const POST = withApiHandler(async (req: NextRequest) => {
  const { goalId, minutes, date, focusRating } = await req.json();
  const logDate = date ?? todayString();
  const durationHours = minutes / 60;

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal)
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  // Attach current step if this goal has steps
  const currentStep = await prisma.step.findFirst({
    where: { goalId, completedAt: null },
    orderBy: { sortOrder: "asc" },
  });

  await prisma.timerSession.create({
    data: {
      goalId,
      date: logDate,
      startTime: new Date(),
      endTime: new Date(),
      duration: durationHours,
      sessionType: "manual",
      focusRating: focusRating ?? null,
      isActive: false,
      stepId: currentStep?.id ?? null,
    },
  });

  const log = await prisma.dailyLog.upsert({
    where: { goalId_date: { goalId, date: logDate } },
    update: { timeSpent: { increment: durationHours } },
    create: {
      goalId,
      date: logDate,
      timeSpent: durationHours,
      targetAtTime: goal.dailyTarget,
    },
  });

  // Persist today's score after manual time entry
  await persistDailyScore(logDate);

  return NextResponse.json(log);
});
