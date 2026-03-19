import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { todayString } from "@/lib/utils";
import { withApiHandler, getAuthUserId } from "@/lib/api";

export const POST = withApiHandler(async (req: NextRequest) => {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = (await req.json()) as { id: string };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const date = todayString();

  const existing = await prisma.choreCompletionLog.findUnique({
    where: { choreId_date: { choreId: id, date } },
  });

  const nowCompleted = !existing?.completed;

  // Update the completion log and archive/unarchive the chore in one transaction.
  // Completing a chore moves it to archived so it disappears from active lists.
  // Un-completing restores it to active so it can be re-done if needed.
  const [log] = await prisma.$transaction([
    prisma.choreCompletionLog.upsert({
      where: { choreId_date: { choreId: id, date } },
      update: { completed: nowCompleted },
      create: { choreId: id, date, completed: true, userId },
    }),
    prisma.chore.update({
      where: { id },
      data: { isArchived: nowCompleted },
    }),
  ]);

  return NextResponse.json(log);
});
