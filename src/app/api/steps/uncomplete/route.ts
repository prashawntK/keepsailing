import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withApiHandler, getAuthUserId } from "@/lib/api";

export const POST = withApiHandler(async (req: NextRequest) => {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { stepId } = await req.json();

  const step = await prisma.step.findFirst({ where: { id: stepId, userId } });
  if (!step) return NextResponse.json({ error: "Step not found" }, { status: 404 });

  const updated = await prisma.step.update({
    where: { id: stepId },
    data: { completedAt: null },
  });

  return NextResponse.json(updated);
});
