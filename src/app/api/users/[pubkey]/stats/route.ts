import type { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";
import { db } from "@/lib/db";
import type { UserStatsResponse } from "@/types/user";
import { BountyStatus } from "@prisma/client";

/**
 * @swagger
 * /api/users/{pubkey}/stats:
 *   get:
 *     tags: [Users]
 *     summary: Get user statistics
 *     description: Retrieve detailed statistics for a user
 *     parameters:
 *       - in: path
 *         name: pubkey
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 earnings:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: string
 *                     bountiesCompleted:
 *                       type: integer
 *                 bounties:
 *                   type: object
 *                   properties:
 *                     created:
 *                       type: integer
 *                     assigned:
 *                       type: integer
 *                     active:
 *                       type: integer
 *                 workspaces:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                 topLanguages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       language:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 performance:
 *                   type: object
 *                   properties:
 *                     averageCompletionTime:
 *                       type: number
 *                       nullable: true
 *       404:
 *         description: User not found
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pubkey: string }> }
) {
  const { pubkey } = await params;
  try {
    const user = await db.user.findUnique({
      where: {
        pubkey,
        deletedAt: null,
      },
      select: {
        pubkey: true,
      },
    });

    if (!user) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "User not found",
        },
        404
      );
    }

    const [
      completedBounties,
      createdBountiesCount,
      assignedBountiesCount,
      activeBountiesCount,
      workspacesCount,
      topLanguages,
    ] = await Promise.all([
      db.bounty.findMany({
        where: {
          assigneePubkey: pubkey,
          status: {
            in: [BountyStatus.PAID, BountyStatus.COMPLETED],
          },
          deletedAt: null,
        },
        select: {
          amount: true,
          codingLanguages: true,
          createdAt: true,
          completedAt: true,
        },
      }),
      db.bounty.count({
        where: {
          creatorPubkey: pubkey,
          deletedAt: null,
        },
      }),
      db.bounty.count({
        where: {
          assigneePubkey: pubkey,
          deletedAt: null,
        },
      }),
      db.bounty.count({
        where: {
          assigneePubkey: pubkey,
          status: {
            in: [BountyStatus.ASSIGNED, BountyStatus.IN_REVIEW],
          },
          deletedAt: null,
        },
      }),
      db.workspaceMember.count({
        where: {
          userPubkey: pubkey,
          workspace: { deletedAt: null },
        },
      }),
      db.bounty.findMany({
        where: {
          assigneePubkey: pubkey,
          status: {
            in: [BountyStatus.PAID, BountyStatus.COMPLETED],
          },
          deletedAt: null,
        },
        select: {
          codingLanguages: true,
        },
      }),
    ]);

    const totalEarned = completedBounties.reduce(
      (sum, bounty) => sum + BigInt(bounty.amount),
      BigInt(0)
    );

    const successRate =
      assignedBountiesCount > 0 ? (completedBounties.length / assignedBountiesCount) * 100 : 0;

    let averageCompletionTime: number | null = null;
    const completionTimes = completedBounties
      .filter((b) => b.completedAt && b.createdAt)
      .map((b) => {
        const created = b.createdAt.getTime();
        const completed = b.completedAt!.getTime();
        return (completed - created) / (1000 * 60 * 60 * 24);
      });

    if (completionTimes.length > 0) {
      averageCompletionTime =
        completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
    }

    const languageCounts = new Map<string, number>();
    topLanguages.forEach((bounty) => {
      bounty.codingLanguages.forEach((lang) => {
        languageCounts.set(lang, (languageCounts.get(lang) || 0) + 1);
      });
    });

    const topSkills = Array.from(languageCounts.entries())
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const response: UserStatsResponse = {
      stats: {
        totalEarned: totalEarned.toString(),
        bountiesCompleted: completedBounties.length,
        bountiesCreated: createdBountiesCount,
        bountiesAssigned: assignedBountiesCount,
        activeBounties: activeBountiesCount,
        workspacesCount,
        successRate: Math.round(successRate * 100) / 100,
        averageCompletionTime: averageCompletionTime
          ? Math.round(averageCompletionTime * 100) / 100
          : null,
        topSkills,
      },
    };

    return apiSuccess(response);
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/users/${pubkey}/stats`,
      method: "GET",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to fetch user stats",
      },
      500
    );
  }
}
