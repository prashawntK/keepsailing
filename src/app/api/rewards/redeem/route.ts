import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { todayString } from "@/lib/utils";
import { withApiHandler } from "@/lib/api";

export const POST = withApiHandler(async (req: NextRequest) => {
  const { rewardId } = await req.json();

  const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
  if (!reward)
    return NextResponse.json({ error: "Reward not found" }, { status: 404 });

  const agg = await prisma.pointsLedger.aggregate({ _sum: { amount: true } });
  const balance = agg._sum.amount ?? 0;

  if (balance < reward.cost) {
    return NextResponse.json(
      { error: "Insufficient points", balance },
      { status: 400 }
    );
  }

  const [entry] = await prisma.$transaction([
    prisma.pointsLedger.create({
      data: {
        amount: -reward.cost,
        reason: "reward_redeemed",
        detail: `Redeemed ${reward.emoji} ${reward.name}`,
        date: todayString(),
      },
    }),
    prisma.reward.update({
      where: { id: rewardId },
      data: { timesRedeemed: { increment: 1 }, lastRedeemed: new Date() },
    }),
  ]);

  return NextResponse.json({
    success: true,
    entry,
    newBalance: balance - reward.cost,
  });
});
