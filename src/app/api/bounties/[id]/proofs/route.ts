import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { submitProofSchema } from "@/validations/bounty.schema";
import { ErrorCode } from "@/types/error";
import { BountyStatus, ProofStatus, BountyActivityAction } from "@prisma/client";
import type { SubmitProofResponse } from "@/types/bounty";
import { apiError, apiCreated, apiPaginated, validateQuery } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * @swagger
 * /api/bounties/{id}/proofs:
 *   get:
 *     tags: [Proofs]
 *     summary: List proofs
 *     description: Get paginated list of proof submissions for a bounty
 *     security:
 *       - NostrAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Paginated list of proofs
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a workspace member
 *       404:
 *         description: Bounty not found
 *   post:
 *     tags: [Proofs]
 *     summary: Submit proof
 *     description: Submit proof of work for an assigned bounty (assignee only)
 *     security:
 *       - NostrAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - proofUrl
 *               - description
 *             properties:
 *               proofUrl:
 *                 type: string
 *                 format: uri
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Proof submitted successfully
 *       400:
 *         description: Invalid status or validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only assignee can submit proof
 *       404:
 *         description: Bounty not found
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bountyId } = await params;
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
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Bounty not found",
        },
        404
      );
    }

    if (bounty.workspace.members.length === 0) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "You must be a workspace member to view proofs",
        },
        403
      );
    }

    const { searchParams } = new URL(request.url);
    const validation = validateQuery(searchParams, querySchema);

    if (validation.error) {
      return validation.error;
    }

    const { page, limit } = validation.data!;
    const skip = (page - 1) * limit;

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

    return apiPaginated(
      proofs.map((proof) => ({
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
      {
        page,
        pageSize: limit,
        totalCount: total,
      }
    );
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/bounties/${bountyId}/proofs`,
      method: "GET",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to fetch proofs",
      },
      500
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bountyId } = await params;
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
    const validation = submitProofSchema.safeParse({ ...body, bountyId });

    if (!validation.success) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Invalid proof submission data",
        },
        400
      );
    }

    const { proofUrl, description } = validation.data;

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
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Bounty not found",
        },
        404
      );
    }

    if (bounty.assigneePubkey !== userPubkey) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "Only the assigned user can submit proof for this bounty",
        },
        403
      );
    }

    if (bounty.status !== BountyStatus.ASSIGNED && bounty.status !== BountyStatus.IN_REVIEW) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: `Cannot submit proof for bounty with status: ${bounty.status}`,
        },
        400
      );
    }

    const proof = await db.$transaction(async (tx) => {
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

      if (bounty.status === BountyStatus.ASSIGNED) {
        await tx.bounty.update({
          where: { id: bountyId },
          data: { status: BountyStatus.IN_REVIEW },
        });
      }

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
      id: proof.id,
      bountyId: proof.bountyId,
      proofUrl: proof.proofUrl,
      description: proof.description,
      status: proof.status,
      createdAt: proof.createdAt.toISOString(),
    };

    return apiCreated(response);
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/bounties/${bountyId}/proofs`,
      method: "POST",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to submit proof",
      },
      500
    );
  }
}
