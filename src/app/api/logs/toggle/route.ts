import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { todayString } from "@/lib/utils";
import { withApiHandler } from "@/lib/api";
import { persistDailyScore } from "@/lib/scoring-server";

export const POST = withApiHandler(async (req: NextRequest) => {
  const { goalId, date } = await req.json();
  const logDate = date ?? todayString();

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal)
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  const existing = await prisma.dailyLog.findUnique({
    where: { goalId_date: { goalId, date: logDate } },
  });

  const newCompleted = !existing?.completed;

  const log = await prisma.dailyLog.upsert({
    where: { goalId_date: { goalId, date: logDate } },
    update: { completed: newCompleted },
    create: {
      goalId,
      date: logDate,
      completed: newCompleted,
      targetAtTime: goal.dailyTarget,
    },
  });

  // Persist today's score after toggle
  persistDailyScore(logDate);

  return NextResponse.json(log);
});
