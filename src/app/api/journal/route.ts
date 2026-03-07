import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { todayString } from "@/lib/utils";
import { withApiHandler } from "@/lib/api";

export const GET = withApiHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? todayString();
  const entry = await prisma.journalEntry.findUnique({ where: { date } });
  return NextResponse.json(entry);
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const { content, mood, date } = await req.json();
  const logDate = date ?? todayString();
  const entry = await prisma.journalEntry.upsert({
    where: { date: logDate },
    update: { content, mood },
    create: { date: logDate, content, mood },
  });
  return NextResponse.json(entry);
});
