import { NextRequest, NextResponse } from "next/server";

type RouteHandler = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> }
) => Promise<NextResponse> | NextResponse;

export function withApiHandler(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Internal server error";
      const isParseError = error instanceof SyntaxError || (error instanceof Error && error.message.includes("JSON"));
      const status = isParseError ? 400 : 500;
      console.error(`[API Error] ${req.method} ${req.nextUrl.pathname}:`, error instanceof Error ? error.stack ?? error.message : error);
      return NextResponse.json({ error: message }, { status });
    }
  };
}
