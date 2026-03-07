import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withApiHandler } from "@/lib/api";
import { persistDailyScore } from "@/lib/scoring-server";

export const POST = withApiHandler(async (req: NextRequest) => {
  const { sessionId, focusRating, elapsed } = await req.json();

  const session = await prisma.timerSession.findUnique({
    where: { id: sessionId },
  });
  if (!session)
    return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const now = new Date();
  const durationHours =
    elapsed != null
      ? elapsed / 3600
      : (now.getTime() - session.startTime.getTime()) / 3600000;

  const updatedSession = await prisma.timerSession.update({
    where: { id: sessionId },
    data: {
      endTime: now,
      duration: durationHours,
      isActive: false,
      focusRating: focusRating ?? null,
    },
  });

  const goal = await prisma.goal.findUnique({ where: { id: session.goalId } });
  const log = await prisma.dailyLog.upsert({
    where: { goalId_date: { goalId: session.goalId, date: session.date } },
    update: { timeSpent: { increment: durationHours } },
    create: {
      goalId: session.goalId,
      date: session.date,
      timeSpent: durationHours,
      targetAtTime: goal?.dailyTarget ?? 0,
    },
  });

  // Persist today's score after timer stop
  persistDailyScore(session.date);

  return NextResponse.json({ session: updatedSession, log });
});
