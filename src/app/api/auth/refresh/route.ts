import type { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { getSessionFromCookies, refreshSessionCookie } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ErrorCode } from "@/types/error";
import { logApiError } from "@/lib/errors/logger";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookies();

    if (!session) {
      return apiError({ code: ErrorCode.UNAUTHORIZED, message: "No session found" }, 401);
    }

    const user = await db.user.findUnique({
      where: { pubkey: session.pubkey },
      select: { id: true, pubkey: true, alias: true, username: true, avatarUrl: true },
    });

    if (!user) {
      return apiError({ code: ErrorCode.UNAUTHORIZED, message: "User not found" }, 401);
    }

    const token = await refreshSessionCookie(user.pubkey, request);

    return apiSuccess({
      refreshed: true,
      user: {
        id: user.id,
        pubkey: user.pubkey,
        alias: user.alias,
        username: user.username,
        avatarUrl: user.avatarUrl,
      },
      token,
    });
  } catch (error) {
    logApiError(error as Error, { url: "/api/auth/refresh", method: "POST" });
    return apiError(
      { code: ErrorCode.INTERNAL_SERVER_ERROR, message: "Failed to refresh session" },
      500
    );
  }
}
