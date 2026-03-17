import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withApiHandler, getAuthUserId } from "@/lib/api";

export const POST = withApiHandler(async (req: NextRequest) => {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await req.json();
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  // Delete the session without touching DailyLog or score — discards the session entirely
  await prisma.timerSession.deleteMany({
    where: { id: sessionId, userId },
  });

  return NextResponse.json({ success: true });
});
