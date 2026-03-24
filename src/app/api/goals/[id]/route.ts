import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withApiHandler, getAuthUserId } from "@/lib/api";

export const GET = withApiHandler(async (_req, ctx) => {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const goal = await prisma.goal.findFirst({
    where: { id, userId },
    include: {
      streaks: true,
      dailyLogs: { orderBy: { date: "desc" }, take: 30 },
      steps: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(goal);
});

export const PATCH = withApiHandler(async (req: NextRequest, ctx) => {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();
  const { steps: stepsInput, ...goalData } = body;

  const existing = await prisma.goal.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const goal = await prisma.goal.update({ where: { id }, data: goalData });

  if (stepsInput !== undefined) {
    await syncSteps(id, userId, stepsInput as { id?: string; name: string }[]);
  }

  return NextResponse.json(goal);
});

async function syncSteps(goalId: string, userId: string, stepsInput: { id?: string; name: string }[]) {
  const existing = await prisma.step.findMany({ where: { goalId } });
  const existingIds = new Set(existing.map((s) => s.id));
  const inputIds = new Set(stepsInput.filter((s) => s.id).map((s) => s.id!));

  // Delete removed steps
  const toDelete = [...existingIds].filter((sid) => !inputIds.has(sid));
  if (toDelete.length > 0) {
    await prisma.step.deleteMany({ where: { id: { in: toDelete } } });
  }

  // Upsert remaining in order
  for (let i = 0; i < stepsInput.length; i++) {
    const s = stepsInput[i];
    if (!s.name?.trim()) continue;
    if (s.id && existingIds.has(s.id)) {
      await prisma.step.update({
        where: { id: s.id },
        data: { name: s.name.trim(), sortOrder: i },
      });
    } else {
      await prisma.step.create({
        data: { goalId, name: s.name.trim(), sortOrder: i, userId },
      });
    }
  }
}

export const DELETE = withApiHandler(async (_req, ctx) => {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const existing = await prisma.goal.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const goal = await prisma.goal.update({
    where: { id },
    data: { isArchived: true, archivedAt: new Date() },
  });
  return NextResponse.json(goal);
});
