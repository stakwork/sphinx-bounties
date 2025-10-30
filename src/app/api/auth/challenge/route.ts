import type { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { generateChallenge, encodeLnurl, generateSphinxDeepLink } from "@/lib/auth/lnurl";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { ErrorCode } from "@/types/error";
import { logApiError } from "@/lib/errors/logger";

/**
 * @swagger
 * /api/auth/challenge:
 *   post:
 *     tags: [Authentication]
 *     summary: Request authentication challenge
 *     description: Generate a Nostr-based LNURL authentication challenge
 *     responses:
 *       200:
 *         description: Challenge generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     k1:
 *                       type: string
 *                       description: Challenge string (32 bytes hex)
 *                     lnurl:
 *                       type: string
 *                       description: Encoded LNURL for authentication
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
  try {
    const host = request.headers.get("host") ?? new URL(env.NEXT_PUBLIC_APP_URL).host;
    const protocol = host.includes("localhost") ? "http" : "https";

    const k1 = generateChallenge();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.authChallenge.create({
      data: {
        k1,
        expiresAt,
        used: false,
      },
    });

    const callbackUrl = `${protocol}://${host}/api/auth/verify?tag=login&k1=${k1}&action=login`;
    const lnurl = encodeLnurl(callbackUrl);
    const sphinxDeepLink = generateSphinxDeepLink(host, k1);

    return apiSuccess(
      {
        k1,
        lnurl,
        sphinxDeepLink,
        expiresAt: expiresAt.toISOString(),
      },
      { requestId: request.headers.get("x-request-id") ?? undefined }
    );
  } catch (error) {
    logApiError(error as Error, {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to generate authentication challenge",
      },
      500
    );
  }
}
