import { apiSuccess, apiError } from "@/lib/api";
import { getSessionFromCookies } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ErrorCode } from "@/types/error";
import { logError } from "@/lib/errors/logger";

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
    if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_MOCK_USER_PUBKEY) {
      const mockPubkey = process.env.NEXT_PUBLIC_MOCK_USER_PUBKEY;
      const user = await db.user.findUnique({
        where: { pubkey: mockPubkey },
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
            message: "Mock user not found",
          },
          404
        );
      }
      return apiSuccess({
        authenticated: true,
        user,
      });
    }

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
