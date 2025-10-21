import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviewProofSchema } from "@/validations/bounty.schema";
import { ERROR_MESSAGES } from "@/lib/error-constants";
import { ProofStatus, BountyActivityAction, WorkspaceRole } from "@prisma/client";
import type { ReviewProofResponse, DeleteProofResponse } from "@/types/bounty";

/**
 * @route PATCH /api/bounties/[id]/proofs/[proofId]
 * @desc Review proof (approve/reject)
 * @access Admin/Owner only
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; proofId: string }> }
) {
  try {
    const { id: bountyId, proofId } = await params;
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

    // Validate request body
    const validationResult = reviewProofSchema.safeParse({ ...body, proofId });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid review data",
            details: validationResult.error.issues,
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    // Get proof with bounty and workspace
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
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Proof not found",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 404 }
      );
    }

    // Verify bounty ID matches
    if (proof.bountyId !== bountyId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "Proof does not belong to this bounty",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    // Check permissions - only admin or owner can review
    const member = proof.bounty.workspace.members[0];
    if (
      !member ||
      (member.role !== WorkspaceRole.ADMIN && proof.bounty.workspace.ownerPubkey !== userPubkey)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only workspace admins or owners can review proofs",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    const { approved, feedback } = validationResult.data;
    const newStatus = approved ? ProofStatus.ACCEPTED : ProofStatus.REJECTED;

    // Update proof status and log activity
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

      // Log activity
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

    return NextResponse.json(
      {
        success: true,
        data: response,
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error reviewing proof:", error);
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

/**
 * @route DELETE /api/bounties/[id]/proofs/[proofId]
 * @desc Delete a proof
 * @access Submitter or Admin/Owner
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; proofId: string }> }
) {
  try {
    const { id: bountyId, proofId } = await params;
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

    // Get proof with bounty and workspace
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
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Proof not found",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 404 }
      );
    }

    // Verify bounty ID matches
    if (proof.bountyId !== bountyId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "Proof does not belong to this bounty",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    // Check permissions - submitter or admin/owner can delete
    const member = proof.bounty.workspace.members[0];
    const isSubmitter = proof.submittedByPubkey === userPubkey;
    const isAdminOrOwner =
      member &&
      (member.role === WorkspaceRole.ADMIN || proof.bounty.workspace.ownerPubkey === userPubkey);

    if (!isSubmitter && !isAdminOrOwner) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You can only delete your own proofs or be an admin/owner",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    // Cannot delete accepted proofs
    if (proof.status === ProofStatus.ACCEPTED) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_STATE",
            message: "Cannot delete an accepted proof",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    // Delete proof
    await db.bountyProof.delete({
      where: { id: proofId },
    });

    const response: DeleteProofResponse = {
      message: "Proof deleted successfully",
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
    console.error("Error deleting proof:", error);
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
