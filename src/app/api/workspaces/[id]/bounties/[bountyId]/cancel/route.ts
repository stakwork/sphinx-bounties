import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { cancelBountySchema } from "@/validations/bounty.schema";
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

    const validation = await validateBody(request, cancelBountySchema);

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
        creatorPubkey: true,
        amount: true,
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

    const isOwnerOrAdmin = ["OWNER", "ADMIN"].includes(member.role);
    const isCreator = bounty.creatorPubkey === user;

    if (!isOwnerOrAdmin && !isCreator) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "Only workspace owners, admins, or bounty creator can cancel this bounty",
        },
        403
      );
    }

    if (bounty.status === BountyStatus.COMPLETED || bounty.status === BountyStatus.PAID) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Cannot cancel a completed or paid bounty",
        },
        400
      );
    }

    await db.$transaction(async (tx) => {
      await tx.bounty.update({
        where: { id: bountyId },
        data: {
          status: BountyStatus.CANCELLED,
        },
      });

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

    return apiSuccess({
      message: "Bounty cancelled successfully",
    });
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/workspaces/${workspaceId}/bounties/${bountyId}/cancel`,
      method: "PATCH",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to cancel bounty",
      },
      500
    );
  }
}
