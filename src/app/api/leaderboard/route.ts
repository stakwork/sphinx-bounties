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
        const totalEarned = user.assignedBounties.reduce(
          (sum, bounty) => sum + BigInt(bounty.amount),
          BigInt(0)
        );

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
        const diff = BigInt(b.totalEarned) - BigInt(a.totalEarned);
        return diff > 0 ? 1 : diff < 0 ? -1 : 0;
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
