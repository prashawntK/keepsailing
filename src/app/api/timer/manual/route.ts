import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { todayString } from "@/lib/utils";
import { withApiHandler, getAuthUserId } from "@/lib/api";
import { recomputeWeekScores } from "@/lib/scoring-server";

export const POST = withApiHandler(async (req: NextRequest) => {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { goalId, minutes, date, focusRating } = await req.json();
  const logDate = date ?? todayString();
  const durationHours = minutes / 60;

  const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
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
      userId,
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
      userId,
    },
  });

  // Persist today's score after manual time entry
  await recomputeWeekScores(logDate, userId);

  return NextResponse.json(log);
});
