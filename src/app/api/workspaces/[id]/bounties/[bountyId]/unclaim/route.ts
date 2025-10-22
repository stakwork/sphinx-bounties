import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { BountyStatus, WorkspaceRole, BountyActivityAction } from "@prisma/client";
import { unclaimBountySchema } from "@/validations/bounty.schema";
import type { ApiResponse } from "@/types/api";
import { ERROR_MESSAGES } from "@/lib/error-constants";

/**
 * @swagger
 * /api/workspaces/{id}/bounties/{bountyId}/unclaim:
 *   patch:
 *     tags: [Bounty Actions]
 *     summary: Unclaim bounty
 *     description: Release a claimed bounty back to open status
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
 *         description: Bounty unclaimed successfully
 *       400:
 *         description: Invalid status or not assigned
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Must be assignee or admin
 *       404:
 *         description: Workspace or bounty not found
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bountyId: string }> }
): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  try {
    const { id: workspaceId, bountyId } = await params;
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

    // Parse request body
    const body = await request.json();
    const validationResult = unclaimBountySchema.safeParse({
      bountyId,
      ...body,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid unclaim data",
            details: validationResult.error.flatten().fieldErrors,
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 422 }
      );
    }

    // Check workspace membership
    const membership = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userPubkey: {
          workspaceId,
          userPubkey,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: ERROR_MESSAGES.NOT_WORKSPACE_MEMBER,
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    // Get bounty and validate state
    const bounty = await db.bounty.findUnique({
      where: {
        id: bountyId,
        workspaceId,
        deletedAt: null,
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

    // Validate bounty can be unclaimed
    if (bounty.status !== BountyStatus.ASSIGNED) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_STATE",
            message: `Cannot unclaim bounty with status: ${bounty.status}. Only ASSIGNED bounties can be unclaimed.`,
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    if (!bounty.assigneePubkey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_STATE",
            message: "Bounty is not assigned to any user",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    // Check permissions: assignee can unclaim, or OWNER/ADMIN can force unclaim
    const isAssignee = bounty.assigneePubkey === userPubkey;
    const canForceUnclaim =
      membership.role === WorkspaceRole.OWNER || membership.role === WorkspaceRole.ADMIN;

    if (!isAssignee && !canForceUnclaim) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only the assignee or workspace admins can unclaim this bounty",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    // Update bounty status back to OPEN
    await db.bounty.update({
      where: { id: bountyId },
      data: {
        status: BountyStatus.OPEN,
        assigneePubkey: null,
        assignedAt: null,
      },
    });

    // Log activity
    await db.bountyActivity.create({
      data: {
        bountyId,
        userPubkey,
        action: BountyActivityAction.UNASSIGNED,
        details: {
          reason: validationResult.data.reason,
          forcedBy: !isAssignee ? userPubkey : undefined,
          previousAssignee: bounty.assigneePubkey,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Bounty unclaimed successfully",
        },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error unclaiming bounty:", error);
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
