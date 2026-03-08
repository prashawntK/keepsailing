import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withApiHandler } from "@/lib/api";

export const GET = withApiHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const showArchived = searchParams.get("archived") === "true";

  const goals = await prisma.goal.findMany({
    where: { isArchived: showArchived },
    orderBy: { sortOrder: "asc" },
    include: { streaks: true, steps: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json(goals);
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const body = await req.json();

  const {
    name,
    emoji = "🎯",
    category,
    goalType = "timer",
    dailyTarget = 0,
    priority = "should",
    activeDays = [0, 1, 2, 3, 4, 5, 6],
    description,
    motivation,
    pomodoroSettings,
    sortOrder = 0,
    steps = [],
  } = body;

  if (!name || !category) {
    return NextResponse.json(
      { error: "name and category are required" },
      { status: 400 }
    );
  }

  const validSteps = (steps as { name: string }[]).filter((s) => s.name?.trim());

  const goal = await prisma.goal.create({
    data: {
      name,
      emoji,
      category,
      goalType,
      dailyTarget,
      priority,
      activeDays,
      description,
      motivation,
      pomodoroSettings,
      sortOrder,
      ...(validSteps.length > 0 && {
        steps: {
          create: validSteps.map((s, i) => ({ name: s.name.trim(), sortOrder: i })),
        },
      }),
    },
  });

  await prisma.streak.create({ data: { goalId: goal.id } });

  return NextResponse.json(goal, { status: 201 });
});
