import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import type { ApiResponse } from "@/types/api";
import type { CompleteBountyResponse } from "@/types/bounty";
import { completeBountySchema } from "@/validations/bounty.schema";
import { BountyStatus, BountyActivityAction } from "@prisma/client";

/**
 * PATCH /api/workspaces/[id]/bounties/[bountyId]/complete
 * Mark a bounty as completed
 * @permission Requires OWNER/ADMIN role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bountyId: string }> }
): Promise<NextResponse<ApiResponse<CompleteBountyResponse>>> {
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

    // Verify workspace membership and check for OWNER/ADMIN role
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

    if (!["OWNER", "ADMIN"].includes(member.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only workspace owners and admins can complete bounties",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validatedData = completeBountySchema.parse(body);

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

    // Get bounty and check status
    const bounty = await db.bounty.findUnique({
      where: {
        id: bountyId,
        workspaceId,
      },
      select: {
        id: true,
        status: true,
        assigneePubkey: true,
        proofs: {
          where: {
            status: "ACCEPTED",
          },
          select: {
            id: true,
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

    // Check if bounty is in the correct state
    if (bounty.status !== BountyStatus.IN_REVIEW) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_STATUS",
            message: "Bounty must be in IN_REVIEW status to be completed",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    // Check if there is an accepted proof
    if (bounty.proofs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_ACCEPTED_PROOF",
            message: "Bounty must have at least one accepted proof before completion",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    // Complete the bounty
    await db.$transaction(async (tx) => {
      await tx.bounty.update({
        where: { id: bountyId },
        data: {
          status: BountyStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // Log the completion activity
      await tx.bountyActivity.create({
        data: {
          bountyId: bounty.id,
          action: BountyActivityAction.COMPLETED,
          userPubkey: user,
          details: {
            completedBy: user,
          },
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Bounty marked as completed successfully",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error completing bounty:", error);

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
          message: "Failed to complete bounty",
        },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 500 }
    );
  }
}
