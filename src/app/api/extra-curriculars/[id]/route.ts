import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withApiHandler, getAuthUserId } from "@/lib/api";

export const PATCH = withApiHandler(async (req: NextRequest, ctx) => {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();

  const existing = await prisma.extraCurricular.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const item = await prisma.extraCurricular.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(item);
});

export const DELETE = withApiHandler(async (_req, ctx) => {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const existing = await prisma.extraCurricular.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const item = await prisma.extraCurricular.update({
    where: { id },
    data: { isArchived: true, archivedAt: new Date() },
  });

  return NextResponse.json(item);
});
