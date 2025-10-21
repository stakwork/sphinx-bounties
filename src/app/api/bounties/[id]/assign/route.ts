import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ERROR_MESSAGES } from "@/lib/error-constants";
import { BountyStatus, BountyActivityAction, WorkspaceRole } from "@prisma/client";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { assigneePubkey } = body;

    if (!assigneePubkey || typeof assigneePubkey !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "assigneePubkey is required",
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
            budget: true,
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

    const workspaceMember = bounty.workspace.members[0];
    const isAdmin =
      workspaceMember &&
      (workspaceMember.role === WorkspaceRole.ADMIN ||
        workspaceMember.role === WorkspaceRole.OWNER);

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only workspace admins can assign bounties",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    if (bounty.status !== BountyStatus.OPEN) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_STATUS",
            message: "Can only assign bounties with OPEN status",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    if (bounty.assigneePubkey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ALREADY_ASSIGNED",
            message: "Bounty is already assigned",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
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
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Assignee not found",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 404 }
      );
    }

    if (assignee.memberships.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Assignee must be a workspace member",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    if (!bounty.workspace.budget) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_BUDGET",
            message: "Workspace has no budget configured",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    if (bounty.workspace.budget.availableBudget < bounty.amount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INSUFFICIENT_BUDGET",
            message: "Insufficient available budget to assign bounty",
            details: {
              required: bounty.amount.toString(),
              available: bounty.workspace.budget.availableBudget.toString(),
            },
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
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

    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Bounty assigned successfully",
          assignee: {
            pubkey: assignee.pubkey,
            username: assignee.username,
          },
        },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error assigning bounty:", error);
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
        assignee: {
          select: {
            pubkey: true,
            username: true,
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

    const workspaceMember = bounty.workspace.members[0];
    const isAdmin =
      workspaceMember &&
      (workspaceMember.role === WorkspaceRole.ADMIN ||
        workspaceMember.role === WorkspaceRole.OWNER);

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only workspace admins can unassign bounties",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    if (!bounty.assigneePubkey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_ASSIGNED",
            message: "Bounty is not assigned",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    if (bounty.status !== BountyStatus.ASSIGNED && bounty.status !== BountyStatus.IN_REVIEW) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_STATUS",
            message: "Can only unassign bounties with ASSIGNED or IN_REVIEW status",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
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

    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Bounty unassigned successfully",
        },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error unassigning bounty:", error);
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
