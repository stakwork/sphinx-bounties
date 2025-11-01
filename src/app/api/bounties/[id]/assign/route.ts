import type { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";
import { db } from "@/lib/db";
import { BountyStatus, BountyActivityAction, WorkspaceRole } from "@prisma/client";

/**
 * @swagger
 * /api/bounties/{id}/assign:
 *   post:
 *     tags: [Bounty Actions]
 *     summary: Assign bounty to hunter
 *     description: Assign an OPEN bounty to a workspace member (admin only)
 *     security:
 *       - NostrAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assigneePubkey
 *             properties:
 *               assigneePubkey:
 *                 type: string
 *                 description: Public key of user to assign
 *     responses:
 *       200:
 *         description: Bounty assigned successfully
 *       400:
 *         description: Invalid status or insufficient budget
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Bounty or assignee not found
 *   delete:
 *     tags: [Bounty Actions]
 *     summary: Unassign bounty
 *     description: Remove hunter assignment and return bounty to OPEN (admin only)
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
 *         description: Bounty unassigned successfully
 *       400:
 *         description: Bounty not assigned or invalid status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Bounty not found
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bountyId } = await params;
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

    const body = await request.json();
    const { assigneePubkey } = body;

    if (!assigneePubkey || typeof assigneePubkey !== "string") {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "assigneePubkey is required",
        },
        400
      );
    }

    const bounty = await db.bounty.findUnique({
      where: {
        id: bountyId,
        deletedAt: null,
      },
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

    const workspaceMember = bounty.workspace.members[0];
    const isAdmin =
      workspaceMember &&
      (workspaceMember.role === WorkspaceRole.ADMIN ||
        workspaceMember.role === WorkspaceRole.OWNER);

    if (!isAdmin) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "Only workspace admins can assign bounties",
        },
        403
      );
    }

    if (bounty.status !== BountyStatus.OPEN) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Can only assign bounties with OPEN status",
        },
        400
      );
    }

    if (bounty.assigneePubkey) {
      return apiError(
        {
          code: ErrorCode.CONFLICT,
          message: "Bounty is already assigned",
        },
        400
      );
    }

    const assignee = await db.user.findUnique({
      where: { pubkey: assigneePubkey },
      select: {
        pubkey: true,
        username: true,
        memberships: {
          where: {
            workspaceId: bounty.workspaceId,
          },
        },
      },
    });

    if (!assignee) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Assignee not found",
        },
        404
      );
    }

    if (assignee.memberships.length === 0) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "Assignee must be a workspace member",
        },
        403
      );
    }

    if (!bounty.workspace.budget) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Workspace has no budget configured",
        },
        400
      );
    }

    if (bounty.workspace.budget.availableBudget < bounty.amount) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Insufficient available budget to assign bounty",
          details: {
            required: bounty.amount.toString(),
            available: bounty.workspace.budget.availableBudget.toString(),
          },
        },
        400
      );
    }

    await db.$transaction(async (tx) => {
      await tx.bounty.update({
        where: { id: bountyId },
        data: {
          assigneePubkey,
          status: BountyStatus.ASSIGNED,
          assignedAt: new Date(),
        },
      });

      await tx.workspaceBudget.update({
        where: { workspaceId: bounty.workspaceId },
        data: {
          availableBudget: { decrement: bounty.amount },
          reservedBudget: { increment: bounty.amount },
        },
      });

      await tx.bountyActivity.create({
        data: {
          bountyId,
          userPubkey,
          action: BountyActivityAction.ASSIGNED,
          details: {
            assigneePubkey,
            assigneeUsername: assignee.username,
          },
        },
      });
    });

    return apiSuccess({
      pubkey: assignee.pubkey,
      username: assignee.username,
    });
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/bounties/[id]/assign`,
      method: "POST",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to assign bounty",
      },
      500
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bountyId } = await params;
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
      include: {
        workspace: {
          include: {
            members: {
              where: { userPubkey },
            },
          },
        },
        assignee: {
          select: {
            pubkey: true,
            username: true,
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

    const workspaceMember = bounty.workspace.members[0];
    const isAdmin =
      workspaceMember &&
      (workspaceMember.role === WorkspaceRole.ADMIN ||
        workspaceMember.role === WorkspaceRole.OWNER);

    if (!isAdmin) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "Only workspace admins can unassign bounties",
        },
        403
      );
    }

    if (!bounty.assigneePubkey) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Bounty is not assigned",
        },
        400
      );
    }

    if (bounty.status !== BountyStatus.ASSIGNED && bounty.status !== BountyStatus.IN_REVIEW) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Can only unassign bounties with ASSIGNED or IN_REVIEW status",
        },
        400
      );
    }

    await db.$transaction(async (tx) => {
      await tx.bounty.update({
        where: { id: bountyId },
        data: {
          assigneePubkey: null,
          status: BountyStatus.OPEN,
          assignedAt: null,
        },
      });

      await tx.workspaceBudget.update({
        where: { workspaceId: bounty.workspaceId },
        data: {
          availableBudget: { increment: bounty.amount },
          reservedBudget: { decrement: bounty.amount },
        },
      });

      await tx.bountyActivity.create({
        data: {
          bountyId,
          userPubkey,
          action: BountyActivityAction.UNASSIGNED,
          details: {
            previousAssignee: bounty.assigneePubkey,
            previousAssigneeUsername: bounty.assignee?.username,
          },
        },
      });
    });

    return apiSuccess({
      message: "Bounty unassigned successfully",
    });
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/bounties/[id]/assign`,
      method: "DELETE",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to unassign bounty",
      },
      500
    );
  }
}
