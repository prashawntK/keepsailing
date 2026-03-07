import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { todayString } from "@/lib/utils";
import { withApiHandler } from "@/lib/api";

export const POST = withApiHandler(async (req: NextRequest) => {
  const { goalId } = await req.json();

  // Stop any currently active session first
  const activeSession = await prisma.timerSession.findFirst({
    where: { isActive: true },
  });

  if (activeSession) {
    const now = new Date();
    const durationHours =
      (now.getTime() - activeSession.startTime.getTime()) / 3600000;

    await prisma.timerSession.update({
      where: { id: activeSession.id },
      data: { endTime: now, duration: durationHours, isActive: false },
    });

    await prisma.dailyLog.upsert({
      where: {
        goalId_date: { goalId: activeSession.goalId, date: activeSession.date },
      },
      update: { timeSpent: { increment: durationHours } },
      create: {
        goalId: activeSession.goalId,
        date: activeSession.date,
        timeSpent: durationHours,
        targetAtTime: 0,
      },
    });
  }

  const date = todayString();
  const session = await prisma.timerSession.create({
    data: { goalId, date, startTime: new Date(), isActive: true },
  });

  return NextResponse.json({ sessionId: session.id, date });
});
