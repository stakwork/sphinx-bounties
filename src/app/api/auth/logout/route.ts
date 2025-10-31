import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
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
    const response = NextResponse.json({
      success: true,
      data: { message: "Logged out successfully" },
      meta: { timestamp: new Date().toISOString() },
    });

    response.cookies.set(AUTH_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
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
