import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withApiHandler, getAuthUserId } from "@/lib/api";

export const GET = withApiHandler(async () => {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [settingsRow, user] = await Promise.all([
    prisma.appSettings.findFirst({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true, email: true, name: true, createdAt: true } }),
  ]);
  const settings = settingsRow ?? await prisma.appSettings.create({ data: { userId } });
  return NextResponse.json({ ...settings, plan: user?.plan ?? "free", email: user?.email, name: user?.name, accountCreatedAt: user?.createdAt ?? null });
});

export const PATCH = withApiHandler(async (req: NextRequest) => {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  let settings = await prisma.appSettings.findFirst({ where: { userId } });
  if (!settings) {
    settings = await prisma.appSettings.create({ data: { userId } });
  }
  const updated = await prisma.appSettings.update({ where: { id: settings.id }, data: body });
  return NextResponse.json(updated);
});
