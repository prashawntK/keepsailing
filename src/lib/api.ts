import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteHandler = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> }
) => Promise<NextResponse> | NextResponse;

/**
 * Wraps an API route with global error handling.
 * Use getAuthUserId() inside your handler to get the authenticated user's ID.
 */
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

/**
 * Returns the authenticated user's ID from the Supabase session, or null.
 * Call this inside any API route handler that needs the current user.
 * The middleware (src/middleware.ts) already blocks unauthenticated page requests,
 * but API routes should also call this and return 401 if null (Task 5).
 */
export async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}
