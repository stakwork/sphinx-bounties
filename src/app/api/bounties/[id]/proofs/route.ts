import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submitProofSchema } from "@/validations/bounty.schema";
import { ERROR_MESSAGES } from "@/lib/error-constants";
import { BountyStatus, ProofStatus, BountyActivityAction } from "@prisma/client";
import type { SubmitProofResponse, ListProofsResponse } from "@/types/bounty";

/**
 * @route GET /api/bounties/[id]/proofs
 * @desc List all proofs for a bounty
 * @access Workspace members
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Get bounty with workspace to check membership
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

    // Check if user is a workspace member
    if (bounty.workspace.members.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You must be a workspace member to view proofs",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    // Get pagination params
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const skip = (page - 1) * limit;

    // Get proofs
    const [proofs, total] = await Promise.all([
      db.bountyProof.findMany({
        where: { bountyId },
        include: {
          submitter: {
            select: {
              pubkey: true,
              username: true,
              alias: true,
              avatarUrl: true,
            },
          },
          reviewer: {
            select: {
              pubkey: true,
              username: true,
              alias: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.bountyProof.count({
        where: { bountyId },
      }),
    ]);

    const response: ListProofsResponse = {
      proofs: proofs.map((proof) => ({
        id: proof.id,
        bountyId: proof.bountyId,
        proofUrl: proof.proofUrl,
        description: proof.description,
        status: proof.status,
        reviewNotes: proof.reviewNotes,
        createdAt: proof.createdAt.toISOString(),
        updatedAt: proof.updatedAt.toISOString(),
        reviewedAt: proof.reviewedAt?.toISOString() || null,
        submitter: proof.submitter,
        reviewer: proof.reviewer,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
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
    console.error("Error listing proofs:", error);
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
 * @route POST /api/bounties/[id]/proofs
 * @desc Submit proof of work for a bounty
 * @access Assignee only
 */
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

    // Validate request body
    const validationResult = submitProofSchema.safeParse({ ...body, bountyId });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid proof submission data",
            details: validationResult.error.issues,
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    // Get bounty with workspace
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

    // Only assignee can submit proof
    if (bounty.assigneePubkey !== userPubkey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only the assigned user can submit proof for this bounty",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    // Check bounty status - must be ASSIGNED or IN_REVIEW
    if (bounty.status !== BountyStatus.ASSIGNED && bounty.status !== BountyStatus.IN_REVIEW) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_STATUS",
            message: `Cannot submit proof for bounty with status: ${bounty.status}`,
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    const { proofUrl, description } = validationResult.data;

    // Create proof and update bounty status in a transaction
    const proof = await db.$transaction(async (tx) => {
      // Create the proof
      const newProof = await tx.bountyProof.create({
        data: {
          bountyId,
          submittedByPubkey: userPubkey,
          proofUrl,
          description,
          status: ProofStatus.PENDING,
        },
        include: {
          submitter: {
            select: {
              pubkey: true,
              username: true,
            },
          },
        },
      });

      // Update bounty status to IN_REVIEW if it's ASSIGNED
      if (bounty.status === BountyStatus.ASSIGNED) {
        await tx.bounty.update({
          where: { id: bountyId },
          data: { status: BountyStatus.IN_REVIEW },
        });
      }

      // Log activity
      await tx.bountyActivity.create({
        data: {
          bountyId,
          userPubkey,
          action: BountyActivityAction.PROOF_SUBMITTED,
          details: {
            proofId: newProof.id,
            proofUrl,
          },
        },
      });

      return newProof;
    });

    const response: SubmitProofResponse = {
      message: "Proof submitted successfully",
      proof: {
        id: proof.id,
        bountyId: proof.bountyId,
        proofUrl: proof.proofUrl,
        description: proof.description,
        status: proof.status,
        createdAt: proof.createdAt.toISOString(),
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: response,
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting proof:", error);
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
