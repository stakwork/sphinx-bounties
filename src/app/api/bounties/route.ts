import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  apiPaginated,
  apiError,
  validateQuery,
  paginationSchema,
  sortSchema,
  getPaginationValues,
} from "@/lib/api";
import { ErrorCode } from "@/types/error";
import { db } from "@/lib/db";
import { BountyStatus, BountyActivityAction, WorkspaceRole } from "@prisma/client";
import { createBountySchema } from "@/validations/bounty.schema";
import { ERROR_MESSAGES } from "@/lib/error-constants";
import type { CreateBountyResponse } from "@/types/bounty";

/**
 * BOUNTIES API
 *
 * Child routes to implement:
 * - [id]/route.ts                 GET, PATCH, DELETE bounty
 * - [id]/assign/route.ts          POST, DELETE assign/unassign hunter
 * - [id]/payment/route.ts         POST, GET bounty payment
 * - [id]/payment/status/route.ts  GET, PATCH payment status
 * - [id]/proofs/route.ts          GET, POST proof submissions
 * - [id]/proofs/[proofId]/route.ts PATCH, DELETE proof
 * - [id]/timing/route.ts          GET, DELETE timing data
 * - [id]/timing/start/route.ts    PUT start timing
 * - [id]/timing/close/route.ts    PUT close timing
 * - leaderboard/route.ts          GET bounty leaderboard
 *
 * Models: Bounty, BountyProof, BountyActivity, Transaction
 */

// Query schema for GET /api/bounties exampple
const bountiesQuerySchema = paginationSchema.merge(sortSchema).extend({
  status: z.nativeEnum(BountyStatus).optional(),
  workspaceId: z.string().uuid().optional(),
  assigneePubkey: z.string().optional(),
  creatorPubkey: z.string().optional(),
  search: z.string().optional(),
});

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
              githubUsername: true,
              avatarUrl: true,
            },
          },
          assignee: {
            select: {
              pubkey: true,
              githubUsername: true,
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

    // Return paginated response
    return apiPaginated(bounties, {
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
    const validationResult = createBountySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid bounty data",
            details: validationResult.error.issues,
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "workspaceId is required",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Workspace not found",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 404 }
      );
    }

    if (workspace.members.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You must be a workspace member to create bounties",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    const member = workspace.members[0];
    if (
      member.role !== WorkspaceRole.OWNER &&
      member.role !== WorkspaceRole.ADMIN &&
      member.role !== WorkspaceRole.CONTRIBUTOR
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Insufficient permissions to create bounties",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    const bountyData = validationResult.data;

    const bounty = await db.$transaction(async (tx) => {
      const newBounty = await tx.bounty.create({
        data: {
          workspaceId,
          creatorPubkey: userPubkey,
          title: bountyData.title,
          description: bountyData.description,
          deliverables: bountyData.deliverables,
          amount: BigInt(bountyData.amount),
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
      amount: bounty.amount.toString(),
      status: bounty.status,
      tags: bounty.tags,
      codingLanguages: bounty.codingLanguages,
      estimatedCompletionDate: bounty.estimatedCompletionDate?.toISOString() || null,
      githubIssueUrl: bounty.githubIssueUrl,
      createdAt: bounty.createdAt.toISOString(),
      creator: bounty.creator,
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
    console.error("Error creating bounty:", error);
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
