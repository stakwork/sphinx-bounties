import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { completeBountySchema } from "@/validations/bounty.schema";
import { BountyStatus, BountyActivityAction } from "@prisma/client";
import { apiSuccess, apiError, validateBody } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";

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

    if (!["OWNER", "ADMIN"].includes(member.role)) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "Only workspace owners and admins can complete bounties",
        },
        403
      );
    }

    const validation = await validateBody(request, completeBountySchema);

    if (validation.error) {
      return validation.error;
    }

    const validatedData = validation.data!;

    if (validatedData.bountyId !== bountyId) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Bounty ID in body does not match URL parameter",
        },
        400
      );
    }

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
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Bounty not found",
        },
        404
      );
    }

    if (bounty.status !== BountyStatus.IN_REVIEW) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Bounty must be in IN_REVIEW status to be completed",
        },
        400
      );
    }

    if (bounty.proofs.length === 0) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Bounty must have at least one accepted proof before completion",
        },
        400
      );
    }

    await db.$transaction(async (tx) => {
      await tx.bounty.update({
        where: { id: bountyId },
        data: {
          status: BountyStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

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

    return apiSuccess({
      message: "Bounty marked as completed successfully",
    });
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/workspaces/${workspaceId}/bounties/${bountyId}/complete`,
      method: "PATCH",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to complete bounty",
      },
      500
    );
  }
}
