import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ErrorCode } from "@/types/error";
import { apiError, apiSuccess } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bountyId } = await params;
  try {
    const userPubkey = request.headers.get("x-user-pubkey");

    if (!userPubkey) {
      return apiError(
        {
          code: ErrorCode.UNAUTHORIZED,
          message: "Authentication required",
        },
        401
      );
    }

    const bounty = await db.bounty.findUnique({
      where: {
        id: bountyId,
        deletedAt: null,
      },
      select: {
        assigneePubkey: true,
        workStartedAt: true,
        workClosedAt: true,
      },
    });

    if (!bounty) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Bounty not found",
        },
        404
      );
    }

    if (bounty.assigneePubkey !== userPubkey) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "Only the assignee can close timing",
        },
        403
      );
    }

    if (!bounty.workStartedAt) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Timing has not been started for this bounty",
        },
        400
      );
    }

    if (bounty.workClosedAt) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Timing has already been closed for this bounty",
        },
        400
      );
    }

    const updated = await db.bounty.update({
      where: { id: bountyId },
      data: {
        workClosedAt: new Date(),
      },
      select: {
        id: true,
        workStartedAt: true,
        workClosedAt: true,
      },
    });

    const duration =
      updated.workClosedAt && updated.workStartedAt
        ? Math.floor((updated.workClosedAt.getTime() - updated.workStartedAt.getTime()) / 1000)
        : null;

    return apiSuccess({
      message: "Timing closed successfully",
      bountyId: updated.id,
      workStartedAt: updated.workStartedAt?.toISOString(),
      workClosedAt: updated.workClosedAt?.toISOString(),
      durationSeconds: duration,
    });
  } catch (error) {
    logApiError(error as Error, {
      url: request.url,
      method: request.method,
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "An unexpected error occurred",
      },
      500
    );
  }
}
