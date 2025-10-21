import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ERROR_MESSAGES } from "@/lib/error-constants";
import type { UserStatsResponse } from "@/types/user";
import { BountyStatus } from "@prisma/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pubkey: string }> }
) {
  try {
    const { pubkey } = await params;

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
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "User not found",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 404 }
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

    return NextResponse.json(
      {
        success: true,
        data: response,
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user stats:", error);
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
