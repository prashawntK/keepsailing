import { NextRequest, NextResponse } from "next/server";
import { todayString } from "@/lib/utils";
import { assembleDashboardData } from "@/lib/dashboard";
import { withApiHandler } from "@/lib/api";

export const GET = withApiHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? todayString();
  const data = await assembleDashboardData(date);
  return NextResponse.json(data);
});
