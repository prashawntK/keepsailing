import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUserId, withApiHandler } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

export const DELETE = withApiHandler(async () => {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Delete the User record — all related records cascade via onDelete: Cascade
  // If the cascade fails for any reason, we catch below
  await prisma.user.delete({ where: { id: userId } });

  // Sign the user out of Supabase so their session is invalidated server-side
  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
});
