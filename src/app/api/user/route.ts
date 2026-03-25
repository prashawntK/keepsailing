import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withApiHandler, getAuthUserId } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(async () => {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, onboardingCompleted: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ name: user.name, onboardingCompleted: user.onboardingCompleted });
});

export const PATCH = withApiHandler(async (req: NextRequest) => {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, age: _age, onboardingCompleted, theme } = body as {
    name?: string;
    age?: number;
    onboardingCompleted?: boolean;
    theme?: string;
  };

  // age is accepted for UX feel but not persisted (no DB field)

  const updateData: { name?: string; onboardingCompleted?: boolean } = {};
  if (name !== undefined) updateData.name = name;
  if (onboardingCompleted !== undefined) updateData.onboardingCompleted = onboardingCompleted;

  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  const user = await prisma.user.upsert({
    where: { id: userId },
    update: updateData,
    create: {
      id: userId,
      email: authUser?.email ?? "",
      name: updateData.name ?? (authUser?.user_metadata?.name as string | undefined) ?? null,
      onboardingCompleted: updateData.onboardingCompleted ?? false,
    },
    select: { name: true, onboardingCompleted: true },
  });

  // If a theme is provided, upsert AppSettings
  if (theme !== undefined) {
    const existing = await prisma.appSettings.findFirst({ where: { userId } });
    if (existing) {
      await prisma.appSettings.update({ where: { id: existing.id }, data: { theme } });
    } else {
      await prisma.appSettings.create({ data: { userId, theme } });
    }
  }

  return NextResponse.json({ name: user.name, onboardingCompleted: user.onboardingCompleted });
});
