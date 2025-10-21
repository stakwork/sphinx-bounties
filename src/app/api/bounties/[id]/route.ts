import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { updateBountySchema } from "@/validations/bounty.schema";
import { ERROR_MESSAGES } from "@/lib/error-constants";
import { BountyStatus, BountyActivityAction, WorkspaceRole } from "@prisma/client";
import type { BountyDetailsResponse, UpdateBountyResponse } from "@/types/bounty";

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
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Bounty not found",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 404 }
      );
    }

    if (bounty.status === BountyStatus.DRAFT) {
      const isCreator = userPubkey === bounty.creatorPubkey;
      const isWorkspaceMember = bounty.workspace.members && bounty.workspace.members.length > 0;

      if (!isCreator && !isWorkspaceMember) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Draft bounties are only visible to creator and workspace members",
            },
            meta: { timestamp: new Date().toISOString() },
          },
          { status: 403 }
        );
      }
    }

    const response: BountyDetailsResponse = {
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
        id: proof.id,
        proofUrl: proof.proofUrl,
        description: proof.description,
        status: proof.status,
        createdAt: proof.createdAt.toISOString(),
        submitter: proof.submitter,
      })),
      activities: bounty.activities.map((activity) => ({
        id: activity.id,
        action: activity.action,
        timestamp: activity.timestamp.toISOString(),
        user: activity.user,
      })),
      _count: bounty._count,
    };

    return NextResponse.json(
      {
        success: true,
        data: response,
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching bounty:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bountyId } = await params;
    const userPubkey = request.headers.get("x-user-pubkey");

    if (!userPubkey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: ERROR_MESSAGES.UNAUTHORIZED,
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = updateBountySchema.safeParse({ ...body, id: bountyId });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid bounty update data",
            details: validationResult.error.issues,
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
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
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Bounty not found",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 404 }
      );
    }

    const isCreator = bounty.creatorPubkey === userPubkey;
    const workspaceMember = bounty.workspace.members[0];
    const isAdmin =
      workspaceMember &&
      (workspaceMember.role === WorkspaceRole.ADMIN ||
        workspaceMember.role === WorkspaceRole.OWNER);

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only the creator or workspace admin can update this bounty",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    const { id: _id, status, ...updateData } = validationResult.data;

    if (status && status !== bounty.status) {
      const validTransitions: Record<BountyStatus, BountyStatus[]> = {
        [BountyStatus.DRAFT]: [BountyStatus.OPEN, BountyStatus.CANCELLED],
        [BountyStatus.OPEN]: [BountyStatus.ASSIGNED, BountyStatus.CANCELLED],
        [BountyStatus.ASSIGNED]: [
          BountyStatus.OPEN,
          BountyStatus.IN_REVIEW,
          BountyStatus.CANCELLED,
        ],
        [BountyStatus.IN_REVIEW]: [
          BountyStatus.ASSIGNED,
          BountyStatus.PAID,
          BountyStatus.CANCELLED,
        ],
        [BountyStatus.PAID]: [BountyStatus.COMPLETED],
        [BountyStatus.COMPLETED]: [],
        [BountyStatus.CANCELLED]: [],
      };

      const allowedTransitions = validTransitions[bounty.status];
      if (!allowedTransitions.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_STATUS_TRANSITION",
              message: `Cannot transition from ${bounty.status} to ${status}`,
            },
            meta: { timestamp: new Date().toISOString() },
          },
          { status: 400 }
        );
      }
    }

    const updatedBounty = await db.$transaction(async (tx) => {
      const updated = await tx.bounty.update({
        where: { id: bountyId },
        data: {
          ...updateData,
          ...(status && { status }),
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

    return NextResponse.json(
      {
        success: true,
        data: response,
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating bounty:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 500 }
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
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: ERROR_MESSAGES.UNAUTHORIZED,
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 401 }
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
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Bounty not found",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 404 }
      );
    }

    const isCreator = bounty.creatorPubkey === userPubkey;
    const workspaceMember = bounty.workspace.members[0];
    const isOwner = workspaceMember && workspaceMember.role === WorkspaceRole.OWNER;

    if (!isCreator && !isOwner) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only the creator or workspace owner can delete this bounty",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    if (
      bounty.status !== BountyStatus.DRAFT &&
      bounty.status !== BountyStatus.OPEN &&
      bounty.status !== BountyStatus.CANCELLED
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_STATUS",
            message: "Cannot delete bounty that is assigned or in progress",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    await db.bounty.update({
      where: { id: bountyId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(
      {
        success: true,
        data: { message: "Bounty deleted successfully" },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting bounty:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 500 }
    );
  }
}
