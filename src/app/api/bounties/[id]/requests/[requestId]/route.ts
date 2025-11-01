import type { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";
import { db } from "@/lib/db";
import {
  BountyStatus,
  BountyActivityAction,
  BountyRequestStatus,
  WorkspaceRole,
} from "@prisma/client";
import { reviewBountyRequestSchema } from "@/validations/bounty.schema";

/**
 * @swagger
 * /api/bounties/{id}/requests/{requestId}:
 *   patch:
 *     tags: [Bounty Requests]
 *     summary: Approve or reject a bounty request
 *     description: Workspace admin approves or rejects a pending request. Approving assigns the bounty to the requester.
 *     security:
 *       - NostrAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Bounty ID
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 description: Action to perform on the request
 *               reviewNote:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional note explaining the decision
 *     responses:
 *       200:
 *         description: Request reviewed successfully
 *       400:
 *         description: Invalid request or bounty already assigned
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Request or bounty not found
 *   delete:
 *     tags: [Bounty Requests]
 *     summary: Cancel a bounty request
 *     description: Hunter cancels their own pending request
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
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Request cancelled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Can only cancel your own request
 *       404:
 *         description: Request not found
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const { id: bountyId, requestId } = await params;
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

    // Parse and validate request body
    const body = await request.json();
    const validation = reviewBountyRequestSchema.safeParse(body);

    if (!validation.success) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Invalid request data",
          details: { errors: validation.error.issues },
        },
        400
      );
    }

    const { action, reviewNote } = validation.data;

    // Get the request with bounty and workspace info
    const bountyRequest = await db.bountyRequest.findUnique({
      where: { id: requestId },
      include: {
        bounty: {
          include: {
            workspace: {
              include: {
                members: {
                  where: { userPubkey },
                },
                budget: true,
              },
            },
          },
        },
        requester: {
          select: {
            pubkey: true,
            username: true,
            alias: true,
            memberships: {
              where: {
                workspaceId: undefined, // Will be set below
              },
            },
          },
        },
      },
    });

    if (!bountyRequest) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Request not found",
        },
        404
      );
    }

    // Verify request belongs to the bounty
    if (bountyRequest.bountyId !== bountyId) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Request does not belong to this bounty",
        },
        400
      );
    }

    // Check admin permission
    const workspaceMember = bountyRequest.bounty.workspace.members[0];
    const isAdmin =
      workspaceMember &&
      (workspaceMember.role === WorkspaceRole.ADMIN ||
        workspaceMember.role === WorkspaceRole.OWNER);

    if (!isAdmin) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "Only workspace admins can review requests",
        },
        403
      );
    }

    // Check request is pending
    if (bountyRequest.status !== BountyRequestStatus.PENDING) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Can only review pending requests",
          details: {
            currentStatus: bountyRequest.status,
          },
        },
        400
      );
    }

    // Check bounty is still open
    if (bountyRequest.bounty.status !== BountyStatus.OPEN) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Bounty is no longer open",
          details: {
            currentStatus: bountyRequest.bounty.status,
          },
        },
        400
      );
    }

    // Check bounty is not already assigned
    if (bountyRequest.bounty.assigneePubkey) {
      return apiError(
        {
          code: ErrorCode.CONFLICT,
          message: "Bounty is already assigned",
        },
        409
      );
    }

    // Get requester with workspace membership check
    const requester = await db.user.findUnique({
      where: { pubkey: bountyRequest.requesterPubkey },
      select: {
        pubkey: true,
        username: true,
        memberships: {
          where: {
            workspaceId: bountyRequest.bounty.workspaceId,
          },
        },
      },
    });

    if (!requester) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Requester not found",
        },
        404
      );
    }

    // Check requester is workspace member
    if (requester.memberships.length === 0) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "Requester must be a workspace member to be assigned",
        },
        403
      );
    }

    if (action === "approve") {
      // Check budget availability
      if (!bountyRequest.bounty.workspace.budget) {
        return apiError(
          {
            code: ErrorCode.VALIDATION_ERROR,
            message: "Workspace has no budget configured",
          },
          400
        );
      }

      if (bountyRequest.bounty.workspace.budget.availableBudget < bountyRequest.bounty.amount) {
        return apiError(
          {
            code: ErrorCode.VALIDATION_ERROR,
            message: "Insufficient available budget to assign bounty",
            details: {
              required: bountyRequest.bounty.amount.toString(),
              available: bountyRequest.bounty.workspace.budget.availableBudget.toString(),
            },
          },
          400
        );
      }

      // Approve request and assign bounty
      await db.$transaction(async (tx) => {
        // Update request status
        await tx.bountyRequest.update({
          where: { id: requestId },
          data: {
            status: BountyRequestStatus.APPROVED,
            reviewedBy: userPubkey,
            reviewedAt: new Date(),
          },
        });

        // Reject all other pending requests for this bounty
        await tx.bountyRequest.updateMany({
          where: {
            bountyId,
            id: { not: requestId },
            status: BountyRequestStatus.PENDING,
          },
          data: {
            status: BountyRequestStatus.REJECTED,
            reviewedBy: userPubkey,
            reviewedAt: new Date(),
          },
        });

        // Assign bounty
        await tx.bounty.update({
          where: { id: bountyId },
          data: {
            assigneePubkey: bountyRequest.requesterPubkey,
            status: BountyStatus.ASSIGNED,
            assignedAt: new Date(),
          },
        });

        // Update workspace budget
        await tx.workspaceBudget.update({
          where: { workspaceId: bountyRequest.bounty.workspaceId },
          data: {
            availableBudget: { decrement: bountyRequest.bounty.amount },
            reservedBudget: { increment: bountyRequest.bounty.amount },
          },
        });

        // Create activity for request approval
        await tx.bountyActivity.create({
          data: {
            bountyId,
            userPubkey,
            action: BountyActivityAction.REQUEST_APPROVED,
            details: {
              requestId,
              requesterPubkey: bountyRequest.requesterPubkey,
              requesterUsername: requester.username,
              reviewNote: reviewNote || null,
            },
          },
        });

        // Create activity for assignment
        await tx.bountyActivity.create({
          data: {
            bountyId,
            userPubkey,
            action: BountyActivityAction.ASSIGNED,
            details: {
              assigneePubkey: bountyRequest.requesterPubkey,
              assigneeUsername: requester.username,
              viaRequest: true,
            },
          },
        });
      });

      return apiSuccess({
        id: requestId,
        status: BountyRequestStatus.APPROVED,
        reviewedBy: userPubkey,
        reviewedAt: new Date().toISOString(),
      });
    } else {
      // Reject request
      await db.$transaction(async (tx) => {
        await tx.bountyRequest.update({
          where: { id: requestId },
          data: {
            status: BountyRequestStatus.REJECTED,
            reviewedBy: userPubkey,
            reviewedAt: new Date(),
          },
        });

        await tx.bountyActivity.create({
          data: {
            bountyId,
            userPubkey,
            action: BountyActivityAction.REQUEST_REJECTED,
            details: {
              requestId,
              requesterPubkey: bountyRequest.requesterPubkey,
              requesterUsername: requester.username,
              reviewNote: reviewNote || null,
            },
          },
        });
      });

      return apiSuccess({
        id: requestId,
        status: BountyRequestStatus.REJECTED,
        reviewedBy: userPubkey,
        reviewedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/bounties/[id]/requests/[requestId]`,
      method: "PATCH",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to review request",
      },
      500
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const { id: bountyId, requestId } = await params;
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

    // Get the request
    const bountyRequest = await db.bountyRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: {
          select: {
            pubkey: true,
            username: true,
          },
        },
      },
    });

    if (!bountyRequest) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Request not found",
        },
        404
      );
    }

    // Verify request belongs to the bounty
    if (bountyRequest.bountyId !== bountyId) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Request does not belong to this bounty",
        },
        400
      );
    }

    // Only requester can cancel their own request
    if (bountyRequest.requesterPubkey !== userPubkey) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "You can only cancel your own requests",
        },
        403
      );
    }

    // Can only cancel pending requests
    if (bountyRequest.status !== BountyRequestStatus.PENDING) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Can only cancel pending requests",
          details: {
            currentStatus: bountyRequest.status,
          },
        },
        400
      );
    }

    // Delete the request
    await db.bountyRequest.delete({
      where: { id: requestId },
    });

    return apiSuccess({
      message: "Request cancelled successfully",
    });
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/bounties/[id]/requests/[requestId]`,
      method: "DELETE",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to cancel request",
      },
      500
    );
  }
}
