import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ErrorCode } from "@/types/error";
import { apiError, apiSuccess } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";

/**
 * @swagger
 * /api/bounties/{id}/timing/close:
 *   put:
 *     tags: [Timing]
 *     summary: Close work timer
 *     description: Stop timing work on a bounty and calculate duration (assignee only)
 *     security:
 *       - NostrAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Timing closed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 bountyId:
 *                   type: string
 *                 workStartedAt:
 *                   type: string
 *                   format: date-time
 *                 workClosedAt:
 *                   type: string
 *                   format: date-time
 *                 durationSeconds:
 *                   type: integer
 *                   nullable: true
 *       400:
 *         description: Timing not started or already closed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only assignee can close timing
 *       404:
 *         description: Bounty not found
 */
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
