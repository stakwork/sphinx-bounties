import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { BountyStatus, WorkspaceRole, BountyActivityAction } from "@prisma/client";
import { claimBountySchema } from "@/validations/bounty.schema";
import type { ApiResponse } from "@/types/api";
import { ERROR_MESSAGES } from "@/lib/error-constants";

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
    const validationResult = claimBountySchema.safeParse({
      bountyId,
      ...body,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid claim data",
            details: validationResult.error.flatten().fieldErrors,
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 422 }
      );
    }

    // Check workspace membership and permissions
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

    // Only OWNER, ADMIN, CONTRIBUTOR can claim bounties
    if (
      membership.role !== WorkspaceRole.OWNER &&
      membership.role !== WorkspaceRole.ADMIN &&
      membership.role !== WorkspaceRole.CONTRIBUTOR
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
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

    // Validate bounty can be claimed
    if (bounty.status !== BountyStatus.OPEN) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_STATE",
            message: `Cannot claim bounty with status: ${bounty.status}. Only OPEN bounties can be claimed.`,
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
            code: "INVALID_STATE",
            message: "Bounty is already assigned to another user",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    // Update bounty status to ASSIGNED
    await db.bounty.update({
      where: { id: bountyId },
      data: {
        status: BountyStatus.ASSIGNED,
        assigneePubkey: userPubkey,
        assignedAt: new Date(),
      },
    });

    // Log activity
    await db.bountyActivity.create({
      data: {
        bountyId,
        userPubkey,
        action: BountyActivityAction.ASSIGNED,
        details: validationResult.data.message
          ? { message: validationResult.data.message }
          : undefined,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Bounty claimed successfully",
        },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error claiming bounty:", error);
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
