import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withApiHandler } from "@/lib/api";

export const GET = withApiHandler(async () => {
  const settings = await prisma.appSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  return NextResponse.json(settings);
});

export const PATCH = withApiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const settings = await prisma.appSettings.update({
    where: { id: "singleton" },
    data: body,
  });
  return NextResponse.json(settings);
});
