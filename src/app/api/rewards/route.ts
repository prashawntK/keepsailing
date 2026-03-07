import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withApiHandler } from "@/lib/api";

export const GET = withApiHandler(async () => {
  const rewards = await prisma.reward.findMany({
    where: { isActive: true },
    orderBy: { cost: "asc" },
  });
  return NextResponse.json(rewards);
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const reward = await prisma.reward.create({ data: body });
  return NextResponse.json(reward, { status: 201 });
});
