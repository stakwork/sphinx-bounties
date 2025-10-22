import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { reviewProofSchema } from "@/validations/bounty.schema";
import { ErrorCode } from "@/types/error";
import { ProofStatus, BountyActivityAction, WorkspaceRole } from "@prisma/client";
import type { ReviewProofResponse, DeleteProofResponse } from "@/types/bounty";
import { apiSuccess, apiError } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";

/**
 * @swagger
 * /api/bounties/{id}/proofs/{proofId}:
 *   patch:
 *     tags: [Proofs]
 *     summary: Review proof
 *     description: Approve or reject proof submission (admin/owner only)
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
 *         name: proofId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approved
 *             properties:
 *               approved:
 *                 type: boolean
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Proof reviewed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin/owner access required
 *       404:
 *         description: Proof not found
 *   delete:
 *     tags: [Proofs]
 *     summary: Delete proof
 *     description: Delete a proof submission (submitter or admin/owner)
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
 *         name: proofId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Proof deleted successfully
 *       400:
 *         description: Cannot delete accepted proof
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Proof not found
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; proofId: string }> }
) {
  const { id: bountyId, proofId } = await params;
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

    const body = await request.json();
    const validation = reviewProofSchema.safeParse({ ...body, proofId });

    if (!validation.success) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Invalid review data",
        },
        400
      );
    }

    const { approved, feedback } = validation.data;

    const proof = await db.bountyProof.findUnique({
      where: { id: proofId },
      include: {
        bounty: {
          include: {
            workspace: {
              include: {
                members: {
                  where: { userPubkey },
                },
              },
            },
          },
        },
      },
    });

    if (!proof) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Proof not found",
        },
        404
      );
    }

    if (proof.bountyId !== bountyId) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Proof does not belong to this bounty",
        },
        400
      );
    }

    const member = proof.bounty.workspace.members[0];
    if (
      !member ||
      (member.role !== WorkspaceRole.ADMIN && proof.bounty.workspace.ownerPubkey !== userPubkey)
    ) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "Only workspace admins or owners can review proofs",
        },
        403
      );
    }

    const newStatus = approved ? ProofStatus.ACCEPTED : ProofStatus.REJECTED;

    const updatedProof = await db.$transaction(async (tx) => {
      const updated = await tx.bountyProof.update({
        where: { id: proofId },
        data: {
          status: newStatus,
          reviewNotes: feedback || null,
          reviewedByPubkey: userPubkey,
          reviewedAt: new Date(),
        },
        include: {
          reviewer: {
            select: {
              pubkey: true,
              username: true,
            },
          },
        },
      });

      await tx.bountyActivity.create({
        data: {
          bountyId,
          userPubkey,
          action: BountyActivityAction.PROOF_REVIEWED,
          details: {
            proofId,
            status: newStatus,
            feedback,
          },
        },
      });

      return updated;
    });

    const response: ReviewProofResponse = {
      message: `Proof ${approved ? "approved" : "rejected"} successfully`,
      proof: {
        id: updatedProof.id,
        status: updatedProof.status,
        reviewNotes: updatedProof.reviewNotes,
        reviewedAt: updatedProof.reviewedAt!.toISOString(),
        reviewedBy: updatedProof.reviewer!,
      },
    };

    return apiSuccess(response);
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/bounties/${bountyId}/proofs/${proofId}`,
      method: "PATCH",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to review proof",
      },
      500
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; proofId: string }> }
) {
  const { id: bountyId, proofId } = await params;
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

    const proof = await db.bountyProof.findUnique({
      where: { id: proofId },
      include: {
        bounty: {
          include: {
            workspace: {
              include: {
                members: {
                  where: { userPubkey },
                },
              },
            },
          },
        },
      },
    });

    if (!proof) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Proof not found",
        },
        404
      );
    }

    if (proof.bountyId !== bountyId) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Proof does not belong to this bounty",
        },
        400
      );
    }

    const member = proof.bounty.workspace.members[0];
    const isSubmitter = proof.submittedByPubkey === userPubkey;
    const isAdminOrOwner =
      member &&
      (member.role === WorkspaceRole.ADMIN || proof.bounty.workspace.ownerPubkey === userPubkey);

    if (!isSubmitter && !isAdminOrOwner) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "You can only delete your own proofs or be an admin/owner",
        },
        403
      );
    }

    if (proof.status === ProofStatus.ACCEPTED) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Cannot delete an accepted proof",
        },
        400
      );
    }

    await db.bountyProof.delete({
      where: { id: proofId },
    });

    const response: DeleteProofResponse = {
      message: "Proof deleted successfully",
    };

    return apiSuccess(response);
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/bounties/${bountyId}/proofs/${proofId}`,
      method: "DELETE",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to delete proof",
      },
      500
    );
  }
}
