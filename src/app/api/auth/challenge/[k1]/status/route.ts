import type { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { ErrorCode } from "@/types/error";

/**
 * Check if a challenge has been completed (authenticated)
 * This is polled by the browser to detect when Sphinx app has authenticated
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ k1: string }> }) {
  try {
    const { k1 } = await params;

    const challenge = await db.authChallenge.findUnique({
      where: { k1 },
      select: {
        pubkey: true,
        used: true,
        expiresAt: true,
      },
    });

    if (!challenge) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Challenge not found",
        },
        404
      );
    }

    if (challenge.expiresAt < new Date()) {
      return apiError(
        {
          code: ErrorCode.BAD_REQUEST,
          message: "Challenge expired",
        },
        400
      );
    }

    const authenticated = Boolean(challenge.pubkey);

    return apiSuccess({
      authenticated,
      pubkey: challenge.pubkey || null,
    });
  } catch {
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to check challenge status",
      },
      500
    );
  }
}
