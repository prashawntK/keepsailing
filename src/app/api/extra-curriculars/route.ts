import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withApiHandler, getAuthUserId } from "@/lib/api";

export const GET = withApiHandler(async (req: NextRequest) => {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const showArchived = searchParams.get("archived") === "true";

  // Last 7 days date strings
  const today = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const items = await prisma.extraCurricular.findMany({
    where: { isArchived: showArchived, userId },
    orderBy: { sortOrder: "asc" },
    include: {
      logs: {
        where: { date: { in: last7 } },
        select: { date: true, completed: true },
      },
    },
  });

  const result = items.map((item) => ({
    ...item,
    last7Days: last7.map((d) => {
      const log = item.logs.find((l) => l.date === d);
      return { date: d, completed: log?.completed ?? false };
    }),
  }));

  return NextResponse.json(result);
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, emoji = "✨", targetMinutes } = body as { name?: string; emoji?: string; targetMinutes?: number };

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const maxSort = await prisma.extraCurricular.aggregate({
    _max: { sortOrder: true },
    where: { userId },
  });
  const sortOrder = (maxSort._max.sortOrder ?? -1) + 1;

  const item = await prisma.extraCurricular.create({
    data: { name: name.trim(), emoji, sortOrder, userId, ...(targetMinutes ? { targetMinutes } : {}) },
  });

  return NextResponse.json(item, { status: 201 });
});
