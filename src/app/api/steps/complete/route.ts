import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withApiHandler } from "@/lib/api";

export const POST = withApiHandler(async (req: NextRequest) => {
  const { stepId } = await req.json();

  const step = await prisma.step.findUnique({ where: { id: stepId } });
  if (!step) return NextResponse.json({ error: "Step not found" }, { status: 404 });
  if (step.completedAt) return NextResponse.json({ error: "Step already completed" }, { status: 400 });

  const updated = await prisma.step.update({
    where: { id: stepId },
    data: { completedAt: new Date() },
  });

  return NextResponse.json(updated);
});
