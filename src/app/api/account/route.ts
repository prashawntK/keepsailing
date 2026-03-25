import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/db";
import { getAuthUserId, withApiHandler } from "@/lib/api";

export const DELETE = withApiHandler(async () => {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Delete all user data — cascades to all related tables
  // Use deleteMany so it doesn't throw if the Prisma row doesn't exist yet
  await prisma.user.deleteMany({ where: { id: userId } });

  // Permanently delete the Supabase Auth user so they can't log back in
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  await adminClient.auth.admin.deleteUser(userId);

  return NextResponse.json({ success: true });
});
