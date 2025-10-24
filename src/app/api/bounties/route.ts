import type { NextRequest } from "next/server";
import { z } from "zod";
import {
  apiPaginated,
  apiError,
  apiCreated,
  validateQuery,
  paginationSchema,
  sortSchema,
  getPaginationValues,
} from "@/lib/api";
import { ErrorCode } from "@/types/error";
import { logApiError } from "@/lib/errors/logger";
import { db } from "@/lib/db";
import { BountyStatus, BountyActivityAction, WorkspaceRole } from "@prisma/client";
import { createBountySchema } from "@/validations/bounty.schema";
import { ERROR_MESSAGES } from "@/lib/error-constants";
import type { CreateBountyResponse } from "@/types/bounty";

const bountiesQuerySchema = paginationSchema.merge(sortSchema).extend({
  status: z.nativeEnum(BountyStatus).optional(),
  workspaceId: z.string().uuid().optional(),
  assigneePubkey: z.string().optional(),
  creatorPubkey: z.string().optional(),
  search: z.string().optional(),
});

/**
 * @swagger
 * /api/bounties:
 *   get:
 *     tags: [Bounties]
 *     summary: List bounties
 *     description: Get paginated list of bounties with optional filtering
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, OPEN, ASSIGNED, IN_REVIEW, PAID, COMPLETED, CANCELLED]
 *       - in: query
 *         name: workspaceId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: assigneePubkey
 *         schema:
 *           type: string
 *       - in: query
 *         name: creatorPubkey
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated list of bounties
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *   post:
 *     tags: [Bounties]
 *     summary: Create bounty
 *     description: Create a new bounty in a workspace
 *     security:
 *       - NostrAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workspaceId
 *               - title
 *               - description
 *               - deliverables
 *               - amount
 *             properties:
 *               workspaceId:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               deliverables:
 *                 type: string
 *               amount:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [DRAFT, OPEN]
 *               estimatedHours:
 *                 type: number
 *               estimatedCompletionDate:
 *                 type: string
 *                 format: date-time
 *               githubIssueUrl:
 *                 type: string
 *               loomVideoUrl:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               codingLanguages:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Bounty created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Workspace not found
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const { data: queryData, error: validationError } = validateQuery(
      searchParams,
      bountiesQuerySchema
    );

    if (validationError) {
      return validationError;
    }

    const {
      page,
      pageSize,
      sortBy,
      sortOrder,
      status,
      workspaceId,
      assigneePubkey,
      creatorPubkey,
      search,
    } = queryData!;

    const { skip, take } = getPaginationValues({ page, pageSize });

    const where = {
      ...(status && { status }),
      ...(workspaceId && { workspaceId }),
      ...(assigneePubkey && { assigneePubkey }),
      ...(creatorPubkey && { creatorPubkey }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      deletedAt: null, // Soft delete filter
    };

    const orderBy = sortBy ? { [sortBy]: sortOrder } : { createdAt: "desc" as const };

    const [bounties, totalCount] = await Promise.all([
      db.bounty.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          creator: {
            select: {
              pubkey: true,
              username: true,
              alias: true,
              avatarUrl: true,
            },
          },
          assignee: {
            select: {
              pubkey: true,
              username: true,
              alias: true,
              avatarUrl: true,
            },
          },
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      db.bounty.count({ where }),
    ]);

    const serializedBounties = bounties.map((bounty) => ({
      ...bounty,
      amount: Number(bounty.amount),
    }));

    // Return paginated response
    return apiPaginated(serializedBounties, {
      page,
      pageSize,
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching bounties:", error);
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to fetch bounties",
      },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userPubkey = request.headers.get("x-user-pubkey");

    if (!userPubkey) {
      return apiError(
        {
          code: ErrorCode.UNAUTHORIZED,
          message: ERROR_MESSAGES.UNAUTHORIZED,
        },
        401
      );
    }

    const body = await request.json();
    const { workspaceId, ...bountyFields } = body;

    if (!workspaceId) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "workspaceId is required",
        },
        400
      );
    }

    const validationResult = createBountySchema.safeParse(bountyFields);

    if (!validationResult.success) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Invalid bounty data",
          details: { issues: validationResult.error.issues },
        },
        400
      );
    }

    const bountyData = validationResult.data;

    const workspace = await db.workspace.findUnique({
      where: {
        id: workspaceId,
        deletedAt: null,
      },
      include: {
        members: {
          where: { userPubkey },
        },
      },
    });

    if (!workspace) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Workspace not found",
        },
        404
      );
    }

    if (workspace.members.length === 0) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "You must be a workspace member to create bounties",
        },
        403
      );
    }

    const member = workspace.members[0];
    if (
      member.role !== WorkspaceRole.OWNER &&
      member.role !== WorkspaceRole.ADMIN &&
      member.role !== WorkspaceRole.CONTRIBUTOR
    ) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "Insufficient permissions to create bounties",
        },
        403
      );
    }

    const bounty = await db.$transaction(async (tx) => {
      const newBounty = await tx.bounty.create({
        data: {
          workspaceId,
          creatorPubkey: userPubkey,
          title: bountyData.title,
          description: bountyData.description,
          deliverables: bountyData.deliverables,
          amount: bountyData.amount,
          status: bountyData.status || BountyStatus.DRAFT,
          estimatedHours: bountyData.estimatedHours,
          estimatedCompletionDate: bountyData.estimatedCompletionDate,
          githubIssueUrl: bountyData.githubIssueUrl || null,
          loomVideoUrl: bountyData.loomVideoUrl || null,
          tags: bountyData.tags || [],
          codingLanguages: bountyData.codingLanguages || [],
        },
        include: {
          creator: {
            select: {
              pubkey: true,
              username: true,
            },
          },
        },
      });

      await tx.bountyActivity.create({
        data: {
          bountyId: newBounty.id,
          userPubkey,
          action: BountyActivityAction.CREATED,
          details: {
            status: newBounty.status,
          },
        },
      });

      return newBounty;
    });

    const response: CreateBountyResponse = {
      id: bounty.id,
      title: bounty.title,
      description: bounty.description,
      deliverables: bounty.deliverables,
      amount: String(bounty.amount),
      status: bounty.status,
      tags: bounty.tags,
      codingLanguages: bounty.codingLanguages,
      estimatedCompletionDate: bounty.estimatedCompletionDate?.toISOString() || null,
      githubIssueUrl: bounty.githubIssueUrl,
      createdAt: bounty.createdAt.toISOString(),
      creator: bounty.creator,
    };

    return apiCreated(response);
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/bounties`,
      method: "POST",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to create bounty",
      },
      500
    );
  }
}
