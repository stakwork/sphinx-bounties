import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ErrorCode } from "@/types/error";
import { BountyStatus, WorkspaceRole } from "@prisma/client";
import { apiError, apiSuccess } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params;
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

    const member = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userPubkey: {
          workspaceId,
          userPubkey,
        },
      },
      select: {
        role: true,
      },
    });

    if (!member) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "Access denied to this workspace",
        },
        403
      );
    }

    if (member.role !== WorkspaceRole.OWNER && member.role !== WorkspaceRole.ADMIN) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "Only workspace owners and admins can view stats",
        },
        403
      );
    }

    const workspace = await db.workspace.findUnique({
      where: {
        id: workspaceId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
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

    const [bounties, totalMembers, budget, activities] = await Promise.all([
      db.bounty.findMany({
        where: {
          workspaceId,
          deletedAt: null,
        },
        select: {
          status: true,
          amount: true,
          createdAt: true,
          completedAt: true,
        },
      }),
      db.workspaceMember.count({
        where: { workspaceId },
      }),
      db.workspaceBudget.findUnique({
        where: { workspaceId },
        select: {
          totalBudget: true,
          paidBudget: true,
          availableBudget: true,
          reservedBudget: true,
        },
      }),
      db.workspaceActivity.count({
        where: { workspaceId },
      }),
    ]);

    const totalBounties = bounties.length;
    const openBounties = bounties.filter((b) => b.status === BountyStatus.OPEN).length;
    const assignedBounties = bounties.filter((b) => b.status === BountyStatus.ASSIGNED).length;
    const completedBounties = bounties.filter(
      (b) => b.status === BountyStatus.COMPLETED || b.status === BountyStatus.PAID
    ).length;

    const totalAllocated = bounties.reduce((sum, b) => sum + BigInt(b.amount), BigInt(0));

    const completedBountiesWithDates = bounties.filter(
      (b) =>
        (b.status === BountyStatus.COMPLETED || b.status === BountyStatus.PAID) && b.completedAt
    );

    let averageCompletionTime: number | null = null;
    if (completedBountiesWithDates.length > 0) {
      const times = completedBountiesWithDates.map((b) => {
        const created = b.createdAt.getTime();
        const completed = b.completedAt!.getTime();
        return (completed - created) / (1000 * 60 * 60 * 24);
      });
      averageCompletionTime = times.reduce((sum, t) => sum + t, 0) / times.length;
    }

    return apiSuccess({
      workspace: {
        id: workspace.id,
        name: workspace.name,
      },
      stats: {
        bounties: {
          total: totalBounties,
          open: openBounties,
          assigned: assignedBounties,
          completed: completedBounties,
        },
        budget: {
          total: budget?.totalBudget.toString() || "0",
          available: budget?.availableBudget.toString() || "0",
          reserved: budget?.reservedBudget.toString() || "0",
          paid: budget?.paidBudget.toString() || "0",
          allocated: totalAllocated.toString(),
        },
        members: {
          total: totalMembers,
        },
        activities: {
          total: activities,
        },
        metrics: {
          averageCompletionTime,
          completionRate: totalBounties > 0 ? (completedBounties / totalBounties) * 100 : 0,
        },
      },
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
