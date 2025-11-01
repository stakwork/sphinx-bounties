import type { NextRequest } from "next/server";
import { apiSuccess, apiError, apiCreated } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";
import { db } from "@/lib/db";
import { BountyStatus, BountyActivityAction, BountyRequestStatus } from "@prisma/client";
import { createBountyRequestSchema } from "@/validations/bounty.schema";

/**
 * @swagger
 * /api/bounties/{id}/requests:
 *   post:
 *     tags: [Bounty Requests]
 *     summary: Request to work on a bounty
 *     description: Hunter submits a request to work on an open bounty
 *     security:
 *       - NostrAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Bounty ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Optional message explaining why you want to work on this bounty
 *     responses:
 *       201:
 *         description: Request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     request:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         bountyId:
 *                           type: string
 *                         status:
 *                           type: string
 *                         message:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *       400:
 *         description: Validation error or invalid bounty status
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - already assigned or duplicate request
 *       404:
 *         description: Bounty not found
 *       409:
 *         description: Conflict - request already exists
 *   get:
 *     tags: [Bounty Requests]
 *     summary: List all requests for a bounty
 *     description: Get all requests for a specific bounty (workspace admins only)
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: Filter by request status
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
 *         description: List of requests
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Bounty not found
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bountyId } = await params;
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

    // Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const validation = createBountyRequestSchema.safeParse(body);

    if (!validation.success) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Invalid request data",
          details: { errors: validation.error.issues },
        },
        400
      );
    }

    const { message } = validation.data;

    // Check if bounty exists and is in valid status
    const bounty = await db.bounty.findUnique({
      where: {
        id: bountyId,
        deletedAt: null,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            pubkey: true,
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

    // Only allow requests on OPEN bounties
    if (bounty.status !== BountyStatus.OPEN) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Can only request assignment on bounties with OPEN status",
          details: {
            currentStatus: bounty.status,
          },
        },
        400
      );
    }

    // Check if already assigned
    if (bounty.assigneePubkey) {
      return apiError(
        {
          code: ErrorCode.CONFLICT,
          message: "Bounty is already assigned",
        },
        409
      );
    }

    // Check if user already has a pending or approved request for this bounty
    const existingRequest = await db.bountyRequest.findUnique({
      where: {
        bountyId_requesterPubkey: {
          bountyId,
          requesterPubkey: userPubkey,
        },
      },
    });

    if (existingRequest) {
      return apiError(
        {
          code: ErrorCode.CONFLICT,
          message: "You already have a request for this bounty",
          details: {
            existingRequestId: existingRequest.id,
            status: existingRequest.status,
          },
        },
        409
      );
    }

    // Get requester info
    const requester = await db.user.findUnique({
      where: { pubkey: userPubkey },
      select: {
        pubkey: true,
        username: true,
        alias: true,
      },
    });

    if (!requester) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "User not found",
        },
        404
      );
    }

    // Create the request and activity in a transaction
    const result = await db.$transaction(async (tx) => {
      const bountyRequest = await tx.bountyRequest.create({
        data: {
          bountyId,
          requesterPubkey: userPubkey,
          status: BountyRequestStatus.PENDING,
          message: message || null,
        },
      });

      await tx.bountyActivity.create({
        data: {
          bountyId,
          userPubkey,
          action: BountyActivityAction.REQUESTED,
          details: {
            requestId: bountyRequest.id,
            requesterUsername: requester.username,
            message: message || null,
          },
        },
      });

      return bountyRequest;
    });

    return apiCreated({
      id: result.id,
      bountyId: result.bountyId,
      status: result.status,
      message: result.message,
      createdAt: result.createdAt.toISOString(),
    });
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/bounties/[id]/requests`,
      method: "POST",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to create bounty request",
      },
      500
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bountyId } = await params;
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as BountyRequestStatus | null;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    // Check if bounty exists and user has admin access
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

    const workspaceMember = bounty.workspace.members[0];
    const isAdmin =
      workspaceMember && (workspaceMember.role === "ADMIN" || workspaceMember.role === "OWNER");

    if (!isAdmin) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "Only workspace admins can view bounty requests",
        },
        403
      );
    }

    // Build where clause
    const where: {
      bountyId: string;
      status?: BountyRequestStatus;
    } = {
      bountyId,
    };

    if (status && Object.values(BountyRequestStatus).includes(status)) {
      where.status = status;
    }

    // Get requests with pagination
    const [requests, total] = await Promise.all([
      db.bountyRequest.findMany({
        where,
        include: {
          requester: {
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
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      db.bountyRequest.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return apiSuccess({
      requests: requests.map((req) => ({
        id: req.id,
        bountyId: req.bountyId,
        requesterPubkey: req.requesterPubkey,
        status: req.status,
        message: req.message,
        reviewedBy: req.reviewedBy,
        reviewedAt: req.reviewedAt?.toISOString() || null,
        createdAt: req.createdAt.toISOString(),
        updatedAt: req.updatedAt.toISOString(),
        requester: req.requester,
        reviewer: req.reviewer,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/bounties/[id]/requests`,
      method: "GET",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to fetch bounty requests",
      },
      500
    );
  }
}
