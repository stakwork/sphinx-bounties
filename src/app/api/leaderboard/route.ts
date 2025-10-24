import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ErrorCode } from "@/types/error";
import { BountyStatus } from "@prisma/client";
import { apiError, apiPaginated, validateQuery } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * @swagger
 * /api/leaderboard:
 *   get:
 *     tags: [Leaderboard]
 *     summary: Get top contributors
 *     description: Retrieve leaderboard of users ranked by total earnings from completed bounties
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
 *     responses:
 *       200:
 *         description: Paginated leaderboard data
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
 *                     properties:
 *                       pubkey:
 *                         type: string
 *                       username:
 *                         type: string
 *                       alias:
 *                         type: string
 *                         nullable: true
 *                       avatarUrl:
 *                         type: string
 *                         nullable: true
 *                       totalEarned:
 *                         type: string
 *                       bountiesCompleted:
 *                         type: integer
 *                       lastCompletedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validation = validateQuery(searchParams, querySchema);

    if (validation.error) {
      return validation.error;
    }

    const { page, limit } = validation.data!;
    const skip = (page - 1) * limit;

    const users = await db.user.findMany({
      where: {
        deletedAt: null,
        assignedBounties: {
          some: {
            status: {
              in: [BountyStatus.PAID, BountyStatus.COMPLETED],
            },
            deletedAt: null,
          },
        },
      },
      select: {
        pubkey: true,
        username: true,
        alias: true,
        avatarUrl: true,
        assignedBounties: {
          where: {
            status: {
              in: [BountyStatus.PAID, BountyStatus.COMPLETED],
            },
            deletedAt: null,
          },
          select: {
            amount: true,
            completedAt: true,
          },
        },
      },
      take: limit + skip,
    });

    const leaderboard = users
      .map((user) => {
        const totalEarned = user.assignedBounties.reduce((sum, bounty) => sum + bounty.amount, 0);

        return {
          pubkey: user.pubkey,
          username: user.username,
          alias: user.alias,
          avatarUrl: user.avatarUrl,
          totalEarned: totalEarned.toString(),
          bountiesCompleted: user.assignedBounties.length,
          lastCompletedAt: user.assignedBounties[0]?.completedAt?.toISOString() || null,
        };
      })
      .sort((a, b) => {
        const diff = Number(b.totalEarned) - Number(a.totalEarned);
        return diff;
      })
      .slice(skip, skip + limit);

    const totalCount = users.length;

    return apiPaginated(leaderboard, {
      page,
      pageSize: limit,
      totalCount,
    });
  } catch (error) {
    logApiError(error as Error, {
      url: request.url,
      method: request.method,
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "An unexpected error occurred",
      },
      500
    );
  }
}
