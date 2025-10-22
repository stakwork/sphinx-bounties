import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ErrorCode } from "@/types/error";
import { apiError, apiSuccess } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";

/**
 * @swagger
 * /api/bounties/{id}/timing:
 *   get:
 *     tags: [Timing]
 *     summary: Get bounty timing data
 *     description: Retrieve work start and close timestamps for a bounty
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
 *         description: Timing data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bountyId:
 *                   type: string
 *                 workStartedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 workClosedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 isActive:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a workspace member
 *       404:
 *         description: Bounty not found
 *   delete:
 *     tags: [Timing]
 *     summary: Delete timing data
 *     description: Clear work start and close timestamps (assignee only)
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
 *         description: Timing data deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only assignee can delete timing data
 *       404:
 *         description: Bounty not found
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
        id: true,
        workStartedAt: true,
        workClosedAt: true,
        assigneePubkey: true,
        workspace: {
          select: {
            members: {
              where: { userPubkey },
              select: { role: true },
            },
          },
        },
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

    if (bounty.workspace.members.length === 0) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "You must be a workspace member to view timing data",
        },
        403
      );
    }

    return apiSuccess({
      bountyId: bounty.id,
      workStartedAt: bounty.workStartedAt?.toISOString() || null,
      workClosedAt: bounty.workClosedAt?.toISOString() || null,
      isActive: bounty.workStartedAt !== null && bounty.workClosedAt === null,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
          message: "Only the assignee can delete timing data",
        },
        403
      );
    }

    await db.bounty.update({
      where: { id: bountyId },
      data: {
        workStartedAt: null,
        workClosedAt: null,
      },
    });

    return apiSuccess({ message: "Timing data deleted successfully" });
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
