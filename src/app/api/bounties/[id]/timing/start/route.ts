import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ErrorCode } from "@/types/error";
import { apiError, apiSuccess } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";

/**
 * @swagger
 * /api/bounties/{id}/timing/start:
 *   put:
 *     tags: [Timing]
 *     summary: Start work timer
 *     description: Start timing work on an assigned bounty (assignee only)
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
 *         description: Timing started successfully
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
 *       400:
 *         description: Timing already active
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only assignee can start timing
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
          message: "Only the assignee can start timing",
        },
        403
      );
    }

    if (bounty.workStartedAt && !bounty.workClosedAt) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Timing is already active for this bounty",
        },
        400
      );
    }

    const updated = await db.bounty.update({
      where: { id: bountyId },
      data: {
        workStartedAt: new Date(),
        workClosedAt: null,
      },
      select: {
        id: true,
        workStartedAt: true,
      },
    });

    return apiSuccess({
      bountyId: updated.id,
      workStartedAt: updated.workStartedAt?.toISOString(),
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
