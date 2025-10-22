import { apiSuccess, apiError } from "@/lib/api";
import { clearSessionCookie } from "@/lib/auth/session";
import { ErrorCode } from "@/types/error";
import { logError } from "@/lib/errors/logger";

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout
 *     description: Clear user session and logout
 *     responses:
 *       200:
 *         description: Logged out successfully
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
 *                     message:
 *                       type: string
 *       500:
 *         description: Server error
 */
export async function POST() {
  try {
    clearSessionCookie();

    return apiSuccess({ message: "Logged out successfully" });
  } catch (error) {
    logError(error as Error, { context: "logout" });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Logout failed",
      },
      500
    );
  }
}
