import type { NextRequest } from "next/server";
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
import { BountyStatus } from "@prisma/client";

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

    // Validate query parameters
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

    // Get pagination values for Prisma
    const { skip, take } = getPaginationValues({ page, pageSize });

    // Build where clause
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

    // Build orderBy clause
    const orderBy = sortBy ? { [sortBy]: sortOrder } : { createdAt: "desc" as const };

    // Fetch bounties and total count in parallel
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
