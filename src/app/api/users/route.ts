import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, apiPaginated, validateQuery } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";
import type { Prisma } from "@prisma/client";

const listUsersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  verified: z.coerce.boolean().optional(),
  sortBy: z.enum(["createdAt", "username", "lastLogin"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: List users
 *     description: Get paginated list of users with filtering and search
 *     parameters:
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by username, alias, or description
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *         description: Filter by GitHub or Twitter verification status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, username, lastLogin]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Paginated list of users with stats
 *       400:
 *         description: Validation error
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validation = validateQuery(searchParams, listUsersSchema);

    if (validation.error) {
      return validation.error;
    }

    const query = validation.data!;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (query.search) {
      where.OR = [
        { username: { contains: query.search, mode: "insensitive" as Prisma.QueryMode } },
        { alias: { contains: query.search, mode: "insensitive" as Prisma.QueryMode } },
        { description: { contains: query.search, mode: "insensitive" as Prisma.QueryMode } },
      ];
    }

    if (query.verified !== undefined) {
      where.OR = [{ githubVerified: query.verified }, { twitterVerified: query.verified }];
    }

    const skip = (query.page - 1) * query.limit;

    const [total, users] = await Promise.all([
      db.user.count({ where }),
      db.user.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
        select: {
          pubkey: true,
          username: true,
          alias: true,
          description: true,
          avatarUrl: true,
          githubUsername: true,
          githubVerified: true,
          twitterUsername: true,
          twitterVerified: true,
          createdAt: true,
          lastLogin: true,
          _count: {
            select: {
              createdBounties: true,
              assignedBounties: true,
              memberships: true,
            },
          },
        },
      }),
    ]);

    return apiPaginated(
      users.map((user) => ({
        pubkey: user.pubkey,
        username: user.username,
        alias: user.alias,
        description: user.description,
        avatarUrl: user.avatarUrl,
        githubUsername: user.githubUsername,
        githubVerified: user.githubVerified,
        twitterUsername: user.twitterUsername,
        twitterVerified: user.twitterVerified,
        createdAt: user.createdAt.toISOString(),
        lastLogin: user.lastLogin?.toISOString() || null,
        stats: {
          bountiesCreated: user._count.createdBounties,
          bountiesAssigned: user._count.assignedBounties,
          workspaces: user._count.memberships,
        },
      })),
      {
        page: query.page,
        pageSize: query.limit,
        totalCount: total,
      }
    );
  } catch (error) {
    logApiError(error as Error, {
      url: "/api/users",
      method: "GET",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to fetch users",
      },
      500
    );
  }
}
