import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { updateBountySchema } from "@/validations/bounty.schema";
import { BountyStatus, BountyActivityAction } from "@prisma/client";
import { apiSuccess, apiError, validateBody } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";
import { mapProgrammingLanguages } from "@/lib/api/enum-mapper";

/**
 * @swagger
 * /api/workspaces/{id}/bounties/{bountyId}:
 *   get:
 *     tags: [Bounties]
 *     summary: Get workspace bounty
 *     description: Get detailed information for a specific bounty in a workspace
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
 *         description: Bounty details retrieved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Workspace or bounty not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bountyId: string }> }
) {
  const { id: workspaceId, bountyId } = await params;
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

    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId, deletedAt: null },
      include: {
        members: {
          where: { userPubkey },
        },
      },
    });

    if (!workspace || workspace.members.length === 0) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Workspace not found or you are not a member",
        },
        404
      );
    }

    const bounty = await db.bounty.findUnique({
      where: {
        id: bountyId,
        workspaceId,
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
          },
        },
        proofs: {
          select: {
            id: true,
            description: true,
            proofUrl: true,
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
          orderBy: {
            createdAt: "desc",
          },
        },
        activities: {
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
          orderBy: {
            timestamp: "desc",
          },
          take: 50,
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

    return apiSuccess({
      id: bounty.id,
      title: bounty.title,
      description: bounty.description,
      deliverables: bounty.deliverables,
      amount: bounty.amount.toString(),
      status: bounty.status,
      tags: bounty.tags,
      codingLanguages: bounty.codingLanguages,
      estimatedHours: bounty.estimatedHours,
      estimatedCompletionDate: bounty.estimatedCompletionDate?.toISOString() || null,
      githubIssueUrl: bounty.githubIssueUrl,
      loomVideoUrl: bounty.loomVideoUrl,
      createdAt: bounty.createdAt.toISOString(),
      updatedAt: bounty.updatedAt.toISOString(),
      assignedAt: bounty.assignedAt?.toISOString() || null,
      completedAt: bounty.completedAt?.toISOString() || null,
      paidAt: bounty.paidAt?.toISOString() || null,
      creator: bounty.creator,
      assignee: bounty.assignee,
      workspace: bounty.workspace,
      proofs: bounty.proofs.map((proof) => ({
        ...proof,
        createdAt: proof.createdAt.toISOString(),
      })),
      activities: bounty.activities.map((activity) => ({
        ...activity,
        timestamp: activity.timestamp.toISOString(),
      })),
      _count: bounty._count,
    });
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/workspaces/${workspaceId}/bounties/${bountyId}`,
      method: "GET",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to fetch bounty details",
      },
      500
    );
  }
}

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

    const validation = await validateBody(request, updateBountySchema);

    if (validation.error) {
      return validation.error;
    }

    const validatedData = validation.data!;

    const existingBounty = await db.bounty.findUnique({
      where: {
        id: bountyId,
        workspaceId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        deliverables: true,
        amount: true,
        status: true,
        tags: true,
        codingLanguages: true,
        estimatedHours: true,
        estimatedCompletionDate: true,
        githubIssueUrl: true,
        loomVideoUrl: true,
        creatorPubkey: true,
      },
    });

    if (!existingBounty) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Bounty not found",
        },
        404
      );
    }

    if (
      existingBounty.status === BountyStatus.COMPLETED ||
      existingBounty.status === BountyStatus.PAID
    ) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Cannot update completed or paid bounty",
        },
        400
      );
    }

    const isOwnerOrAdmin = ["OWNER", "ADMIN"].includes(member.role);
    const isCreator = existingBounty.creatorPubkey === user;

    if (!isOwnerOrAdmin && !isCreator) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "You don't have permission to update this bounty",
        },
        403
      );
    }

    if (validatedData.amount !== undefined && !isOwnerOrAdmin) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "Only workspace owners and admins can change bounty amount",
        },
        403
      );
    }

    let budgetAdjustment: number | null = null;
    if (validatedData.amount !== undefined) {
      const oldAmount = existingBounty.amount;
      const newAmount = validatedData.amount;
      budgetAdjustment = newAmount - oldAmount;

      if (budgetAdjustment !== 0) {
        const workspaceBudget = await db.workspaceBudget.findUnique({
          where: { workspaceId },
        });

        if (!workspaceBudget) {
          return apiError(
            {
              code: ErrorCode.NOT_FOUND,
              message: "Workspace budget not found",
            },
            404
          );
        }

        if (budgetAdjustment > 0) {
          if (workspaceBudget.availableBudget < budgetAdjustment) {
            return apiError(
              {
                code: ErrorCode.INSUFFICIENT_BUDGET,
                message: "Insufficient workspace budget for amount increase",
              },
              400
            );
          }
        }
      }
    }

    const updatedBounty = await db.$transaction(async (tx) => {
      const bounty = await tx.bounty.update({
        where: { id: bountyId },
        data: {
          title: validatedData.title,
          description: validatedData.description,
          deliverables: validatedData.deliverables,
          amount: validatedData.amount,
          tags: validatedData.tags,
          codingLanguages: validatedData.codingLanguages
            ? mapProgrammingLanguages(validatedData.codingLanguages)
            : undefined,
          estimatedHours: validatedData.estimatedHours,
          estimatedCompletionDate: validatedData.estimatedCompletionDate,
          githubIssueUrl: validatedData.githubIssueUrl,
          loomVideoUrl: validatedData.loomVideoUrl,
        },
        select: {
          id: true,
          title: true,
          description: true,
          deliverables: true,
          amount: true,
          status: true,
          tags: true,
          codingLanguages: true,
          estimatedHours: true,
          estimatedCompletionDate: true,
          githubIssueUrl: true,
          loomVideoUrl: true,
          updatedAt: true,
        },
      });

      if (budgetAdjustment !== null && budgetAdjustment !== 0) {
        if (budgetAdjustment > 0) {
          await tx.workspaceBudget.update({
            where: { workspaceId },
            data: {
              availableBudget: {
                decrement: budgetAdjustment,
              },
              reservedBudget: {
                increment: budgetAdjustment,
              },
            },
          });
        } else {
          await tx.workspaceBudget.update({
            where: { workspaceId },
            data: {
              availableBudget: {
                increment: -budgetAdjustment,
              },
              reservedBudget: {
                decrement: -budgetAdjustment,
              },
            },
          });
        }
      }

      await tx.bountyActivity.create({
        data: {
          bountyId: bounty.id,
          action: BountyActivityAction.UPDATED,
          userPubkey: user,
          details: {
            changes: validatedData,
            budgetAdjustment: budgetAdjustment?.toString() ?? null,
          },
        },
      });

      return bounty;
    });

    return apiSuccess({
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
        estimatedCompletionDate: updatedBounty.estimatedCompletionDate?.toISOString() ?? null,
        githubIssueUrl: updatedBounty.githubIssueUrl,
        loomVideoUrl: updatedBounty.loomVideoUrl,
      },
    });
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/workspaces/${workspaceId}/bounties/${bountyId}`,
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
