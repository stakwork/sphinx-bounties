import type { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";
import { ERROR_MESSAGES } from "@/lib/error-constants";
import { db } from "@/lib/db";
import { updateBountySchema } from "@/validations/bounty.schema";
import {
  BountyStatus as PrismaBountyStatus,
  BountyActivityAction,
  WorkspaceRole as PrismaWorkspaceRole,
} from "@prisma/client";
import { BountyStatus } from "@/types/enums";
import type { UpdateBountyResponse } from "@/types/bounty";
import { mapBountyStatus } from "@/lib/api/enum-mapper";

/**
 * @swagger
 * /api/bounties/{id}:
 *   get:
 *     tags: [Bounties]
 *     summary: Get bounty details
 *     description: Retrieve detailed information about a specific bounty
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Bounty details retrieved successfully
 *       403:
 *         description: Draft bounty access denied
 *       404:
 *         description: Bounty not found
 *   patch:
 *     tags: [Bounties]
 *     summary: Update bounty
 *     description: Update bounty information (creator or admin only)
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               deliverables:
 *                 type: string
 *               amount:
 *                 type: integer
 *               status:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Bounty updated successfully
 *       400:
 *         description: Invalid status transition or validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Bounty not found
 *   delete:
 *     tags: [Bounties]
 *     summary: Delete bounty
 *     description: Soft delete a bounty (creator or owner only)
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
 *         description: Bounty deleted successfully
 *       400:
 *         description: Cannot delete assigned or in-progress bounty
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Bounty not found
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bountyId } = await params;
    const userPubkey = request.headers.get("x-user-pubkey");

    const bounty = await db.bounty.findUnique({
      where: {
        id: bountyId,
        deletedAt: null,
      },
      include: {
        creator: {
          select: {
            pubkey: true,
            username: true,
            alias: true,
            avatarUrl: true,
          },
        },
        assignee: {
          select: {
            pubkey: true,
            username: true,
            alias: true,
            avatarUrl: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            members: userPubkey
              ? {
                  where: { userPubkey },
                  select: { role: true },
                }
              : false,
          },
        },
        proofs: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            proofUrl: true,
            description: true,
            status: true,
            createdAt: true,
            submitter: {
              select: {
                pubkey: true,
                username: true,
                alias: true,
              },
            },
          },
        },
        activities: {
          orderBy: { timestamp: "desc" },
          take: 10,
          select: {
            id: true,
            action: true,
            timestamp: true,
            user: {
              select: {
                pubkey: true,
                username: true,
                alias: true,
              },
            },
          },
        },
        _count: {
          select: {
            proofs: true,
            activities: true,
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

    if (bounty.status === BountyStatus.DRAFT) {
      const isCreator = userPubkey === bounty.creatorPubkey;
      const isWorkspaceMember = bounty.workspace.members && bounty.workspace.members.length > 0;

      if (!isCreator && !isWorkspaceMember) {
        return apiError(
          {
            code: ErrorCode.FORBIDDEN,
            message: "Draft bounties are only visible to creator and workspace members",
          },
          403
        );
      }
    }

    return apiSuccess(bounty);
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/bounties/[id]`,
      method: "GET",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to fetch bounty",
      },
      500
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bountyId } = await params;
    const userPubkey = request.headers.get("x-user-pubkey");

    if (!userPubkey) {
      return apiError(
        {
          code: ErrorCode.UNAUTHORIZED,
          message: ERROR_MESSAGES.UNAUTHORIZED,
        },
        401
      );
    }

    const body = await request.json();
    const validationResult = updateBountySchema.safeParse({ ...body, id: bountyId });

    if (!validationResult.success) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Invalid bounty update data",
          details: { issues: validationResult.error.issues },
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

    const isCreator = bounty.creatorPubkey === userPubkey;
    const workspaceMember = bounty.workspace.members[0];
    const isAdmin =
      workspaceMember &&
      (workspaceMember.role === PrismaWorkspaceRole.ADMIN ||
        workspaceMember.role === PrismaWorkspaceRole.OWNER);

    if (!isCreator && !isAdmin) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "Only the creator or workspace admin can update this bounty",
        },
        403
      );
    }

    const { id: _id, status, ...updateData } = validationResult.data;

    if (status && status !== bounty.status) {
      const validTransitions: Record<string, string[]> = {
        [PrismaBountyStatus.DRAFT]: [PrismaBountyStatus.OPEN, PrismaBountyStatus.CANCELLED],
        [PrismaBountyStatus.OPEN]: [PrismaBountyStatus.ASSIGNED, PrismaBountyStatus.CANCELLED],
        [PrismaBountyStatus.ASSIGNED]: [
          PrismaBountyStatus.OPEN,
          PrismaBountyStatus.IN_REVIEW,
          PrismaBountyStatus.CANCELLED,
        ],
        [PrismaBountyStatus.IN_REVIEW]: [
          PrismaBountyStatus.ASSIGNED,
          PrismaBountyStatus.PAID,
          PrismaBountyStatus.CANCELLED,
        ],
        [PrismaBountyStatus.PAID]: [PrismaBountyStatus.COMPLETED],
        [PrismaBountyStatus.COMPLETED]: [],
        [PrismaBountyStatus.CANCELLED]: [],
      };

      const allowedTransitions = validTransitions[bounty.status];
      if (!allowedTransitions.includes(status)) {
        return apiError(
          {
            code: ErrorCode.VALIDATION_ERROR,
            message: `Cannot transition from ${bounty.status} to ${status}`,
          },
          400
        );
      }
    }

    const updatedBounty = await db.$transaction(async (tx) => {
      const updated = await tx.bounty.update({
        where: { id: bountyId },
        data: {
          ...(updateData as Record<string, unknown>),
          ...(status && { status: mapBountyStatus(status) }),
          ...(status === BountyStatus.COMPLETED && { completedAt: new Date() }),
        },
      });

      await tx.bountyActivity.create({
        data: {
          bountyId,
          userPubkey,
          action: BountyActivityAction.UPDATED,
          details: {
            changes: Object.keys(updateData),
            ...(status && { statusChange: { from: bounty.status, to: status } }),
          },
        },
      });

      return updated;
    });

    const response: UpdateBountyResponse = {
      message: "Bounty updated successfully",
      bounty: {
        id: updatedBounty.id,
        title: updatedBounty.title,
        description: updatedBounty.description,
        deliverables: updatedBounty.deliverables,
        amount: updatedBounty.amount.toString(),
        status: updatedBounty.status,
        tags: updatedBounty.tags,
        codingLanguages: updatedBounty.codingLanguages,
        estimatedHours: updatedBounty.estimatedHours,
        estimatedCompletionDate: updatedBounty.estimatedCompletionDate?.toISOString() || null,
        githubIssueUrl: updatedBounty.githubIssueUrl,
        loomVideoUrl: updatedBounty.loomVideoUrl,
      },
    };

    return apiSuccess(response);
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/bounties/[id]`,
      method: "PATCH",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to update bounty",
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
          message: ERROR_MESSAGES.UNAUTHORIZED,
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

    const isCreator = bounty.creatorPubkey === userPubkey;
    const workspaceMember = bounty.workspace.members[0];
    const isOwner = workspaceMember && workspaceMember.role === PrismaWorkspaceRole.OWNER;

    if (!isCreator && !isOwner) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "Only the creator or workspace owner can delete this bounty",
        },
        403
      );
    }

    if (
      bounty.status !== BountyStatus.DRAFT &&
      bounty.status !== BountyStatus.OPEN &&
      bounty.status !== BountyStatus.CANCELLED
    ) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Cannot delete bounty that is assigned or in progress",
        },
        400
      );
    }

    await db.bounty.update({
      where: { id: bountyId },
      data: { deletedAt: new Date() },
    });

    return apiSuccess({ message: "Bounty deleted successfully" });
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/bounties/[id]`,
      method: "DELETE",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to delete bounty",
      },
      500
    );
  }
}
