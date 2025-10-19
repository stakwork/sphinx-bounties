import { apiSuccess, apiError } from "@/lib/api";
import { getSessionFromCookies } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ErrorCode } from "@/types/error";
import { logError } from "@/lib/errors/logger";

export async function GET() {
  try {
    const session = await getSessionFromCookies();

    if (!session) {
      return apiError(
        {
          code: ErrorCode.UNAUTHORIZED,
          message: "Not authenticated",
        },
        401
      );
    }

    const user = await db.user.findUnique({
      where: { pubkey: session.pubkey },
      select: {
        id: true,
        pubkey: true,
        username: true,
        alias: true,
        description: true,
        avatarUrl: true,
        githubUsername: true,
        githubVerified: true,
        twitterUsername: true,
        twitterVerified: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "User not found",
        },
        404
      );
    }

    return apiSuccess({
      authenticated: true,
      user,
    });
  } catch (error) {
    logError(error as Error, { context: "session-fetch" });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to fetch session",
      },
      500
    );
  }
}
