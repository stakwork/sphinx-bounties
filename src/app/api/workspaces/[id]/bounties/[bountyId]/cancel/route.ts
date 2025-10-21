import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import type { ApiResponse } from "@/types/api";
import type { CancelBountyResponse } from "@/types/bounty";
import { cancelBountySchema } from "@/validations/bounty.schema";
import { BountyStatus, BountyActivityAction } from "@prisma/client";

/**
 * PATCH /api/workspaces/[id]/bounties/[bountyId]/cancel
 * Cancel a bounty
 * @permission Requires OWNER/ADMIN role or bounty creator
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bountyId: string }> }
): Promise<NextResponse<ApiResponse<CancelBountyResponse>>> {
  try {
    const { id: workspaceId, bountyId } = await params;
    const user = await request.headers.get("x-user-pubkey");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 401 }
      );
    }

    // Verify workspace membership
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
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Access denied to this workspace",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validatedData = cancelBountySchema.parse(body);

    // Verify bounty ID matches
    if (validatedData.bountyId !== bountyId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BOUNTY_ID_MISMATCH",
            message: "Bounty ID in body does not match URL parameter",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    // Get bounty and check permissions
    const bounty = await db.bounty.findUnique({
      where: {
        id: bountyId,
        workspaceId,
      },
      select: {
        id: true,
        status: true,
        creatorPubkey: true,
        amount: true,
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

    // Check permissions: OWNER/ADMIN can cancel, or creator can cancel
    const isOwnerOrAdmin = ["OWNER", "ADMIN"].includes(member.role);
    const isCreator = bounty.creatorPubkey === user;

    if (!isOwnerOrAdmin && !isCreator) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only workspace owners, admins, or bounty creator can cancel this bounty",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    // Check if bounty can be cancelled
    if (bounty.status === BountyStatus.COMPLETED || bounty.status === BountyStatus.PAID) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BOUNTY_COMPLETED",
            message: "Cannot cancel a completed or paid bounty",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    // Cancel the bounty and release reserved budget
    await db.$transaction(async (tx) => {
      await tx.bounty.update({
        where: { id: bountyId },
        data: {
          status: BountyStatus.CANCELLED,
        },
      });

      // Release reserved budget back to available budget
      await tx.workspaceBudget.update({
        where: { workspaceId },
        data: {
          availableBudget: {
            increment: bounty.amount,
          },
          reservedBudget: {
            decrement: bounty.amount,
          },
        },
      });

      // Log the cancellation activity
      await tx.bountyActivity.create({
        data: {
          bountyId: bounty.id,
          action: BountyActivityAction.CANCELLED,
          userPubkey: user,
          details: {
            cancelledBy: user,
            reason: validatedData.reason,
            isOwnerOrAdmin,
            isCreator,
          },
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Bounty cancelled successfully",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error cancelling bounty:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to cancel bounty",
        },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 500 }
    );
  }
}
