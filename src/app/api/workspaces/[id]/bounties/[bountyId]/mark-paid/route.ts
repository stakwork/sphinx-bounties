import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { BountyStatus, BountyActivityAction } from "@prisma/client";
import { apiSuccess, apiError } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";

/**
 * @swagger
 * /api/workspaces/{id}/bounties/{bountyId}/mark-paid:
 *   patch:
 *     tags: [Bounty Actions]
 *     summary: Mark bounty as paid
 *     description: Mark a completed bounty as paid (admin/owner only)
 *     security:
 *       - NostrAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: bountyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Bounty marked as paid successfully
 *       400:
 *         description: Bounty not in COMPLETED status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin/owner access required
 *       404:
 *         description: Workspace or bounty not found
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bountyId: string }> }
) {
  const { id: workspaceId, bountyId } = await params;
  try {
    const user = request.headers.get("x-user-pubkey");

    if (!user) {
      return apiError(
        {
          code: ErrorCode.UNAUTHORIZED,
          message: "Authentication required",
        },
        401
      );
    }

    const member = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userPubkey: {
          workspaceId,
          userPubkey: user,
        },
      },
      select: {
        role: true,
      },
    });

    if (!member) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "Access denied to this workspace",
        },
        403
      );
    }

    if (!["OWNER", "ADMIN"].includes(member.role)) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "Only workspace owners and admins can mark bounties as paid",
        },
        403
      );
    }

    const bounty = await db.bounty.findUnique({
      where: {
        id: bountyId,
        workspaceId,
      },
      select: {
        id: true,
        status: true,
        amount: true,
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

    if (bounty.status !== BountyStatus.COMPLETED) {
      return apiError(
        {
          code: ErrorCode.INVALID_STATUS,
          message: "Only completed bounties can be marked as paid",
        },
        400
      );
    }

    await db.$transaction(async (tx) => {
      await tx.bounty.update({
        where: { id: bountyId },
        data: {
          status: BountyStatus.PAID,
        },
      });

      await tx.workspaceBudget.update({
        where: { workspaceId },
        data: {
          reservedBudget: { decrement: bounty.amount },
          paidBudget: { increment: bounty.amount },
        },
      });

      await tx.bountyActivity.create({
        data: {
          bountyId: bounty.id,
          action: BountyActivityAction.PAID,
          userPubkey: user,
          details: {
            markedPaidBy: user,
            amount: bounty.amount.toString(),
          },
        },
      });
    });

    return apiSuccess({
      message: "Bounty marked as paid successfully",
    });
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/workspaces/${workspaceId}/bounties/${bountyId}/mark-paid`,
      method: "PATCH",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to mark bounty as paid",
      },
      500
    );
  }
}
