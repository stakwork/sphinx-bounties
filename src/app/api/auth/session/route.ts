import type { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { getSessionFromCookies, setSessionCookie } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ErrorCode } from "@/types/error";
import { logApiError } from "@/lib/errors/logger";

/**
 * @swagger
 * /api/auth/session:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current session
 *     description: Retrieve authenticated user session information
 *     responses:
 *       200:
 *         description: Session retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     authenticated:
 *                       type: boolean
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         pubkey:
 *                           type: string
 *                         username:
 *                           type: string
 *                         alias:
 *                           type: string
 *                           nullable: true
 *                         description:
 *                           type: string
 *                           nullable: true
 *                         avatarUrl:
 *                           type: string
 *                           nullable: true
 *                         githubUsername:
 *                           type: string
 *                           nullable: true
 *                         githubVerified:
 *                           type: boolean
 *                         twitterUsername:
 *                           type: string
 *                           nullable: true
 *                         twitterVerified:
 *                           type: boolean
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         lastLogin:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 */
export async function GET() {
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

    return apiSuccess({
      authenticated: true,
      user: {
        id: user.id,
        pubkey: user.pubkey,
        alias: user.alias,
        username: user.username,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    logApiError(error as Error, { url: "/api/auth/session", method: "GET" });
    return apiError(
      { code: ErrorCode.INTERNAL_SERVER_ERROR, message: "Failed to fetch session" },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { k1 } = body;

    if (!k1 || typeof k1 !== "string") {
      return apiError({ code: ErrorCode.BAD_REQUEST, message: "Missing or invalid k1" }, 400);
    }

    const challenge = await db.authChallenge.findUnique({
      where: { k1 },
    });

    if (!challenge) {
      return apiError({ code: ErrorCode.NOT_FOUND, message: "Challenge not found" }, 404);
    }

    if (!challenge.pubkey) {
      return apiError({ code: ErrorCode.UNAUTHORIZED, message: "Challenge not verified yet" }, 401);
    }

    if (new Date() > challenge.expiresAt) {
      return apiError({ code: ErrorCode.BAD_REQUEST, message: "Challenge expired" }, 400);
    }

    const user = await db.user.findUnique({
      where: { pubkey: challenge.pubkey },
      select: { id: true, pubkey: true, alias: true, username: true, avatarUrl: true },
    });

    if (!user) {
      return apiError({ code: ErrorCode.NOT_FOUND, message: "User not found" }, 404);
    }

    await setSessionCookie(user.pubkey, request);

    return apiSuccess({
      authenticated: true,
      user: {
        id: user.id,
        pubkey: user.pubkey,
        alias: user.alias,
        username: user.username,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    logApiError(error as Error, { url: "/api/auth/session", method: "POST" });
    return apiError(
      { code: ErrorCode.INTERNAL_SERVER_ERROR, message: "Failed to create session" },
      500
    );
  }
}
