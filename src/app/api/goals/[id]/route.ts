import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withApiHandler } from "@/lib/api";

export const GET = withApiHandler(async (_req, ctx) => {
  const { id } = await ctx.params;
  const goal = await prisma.goal.findUnique({
    where: { id },
    include: {
      streaks: true,
      dailyLogs: { orderBy: { date: "desc" }, take: 30 },
    },
  });
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(goal);
});

export const PATCH = withApiHandler(async (req: NextRequest, ctx) => {
  const { id } = await ctx.params;
  const body = await req.json();
  const goal = await prisma.goal.update({ where: { id }, data: body });
  return NextResponse.json(goal);
});

export const DELETE = withApiHandler(async (_req, ctx) => {
  const { id } = await ctx.params;
  const goal = await prisma.goal.update({
    where: { id },
    data: { isArchived: true, archivedAt: new Date() },
  });
  return NextResponse.json(goal);
});
