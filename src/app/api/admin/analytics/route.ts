import type { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";

export async function GET(request: NextRequest) {
  try {
    const [usersCount, workspacesCount, bountiesCount, openBountiesCount, paidAgg] =
      await Promise.all([
        db.user.count(),
        db.workspace.count(),
        db.bounty.count(),
        db.bounty.count({ where: { status: "OPEN" } }),
        db.transaction.aggregate({
          where: { status: "COMPLETED", type: "PAYMENT" },
          _sum: { amount: true },
        }),
      ]);

    const totalPaidSats = paidAgg._sum?.amount ?? 0;

    return apiSuccess({
      usersCount,
      workspacesCount,
      bountiesCount,
      openBountiesCount,
      totalPaidSats,
    });
  } catch (error) {
    logApiError(error as Error, {
      url: request.url,
      method: request.method,
    });
    return apiError(
      { code: ErrorCode.INTERNAL_SERVER_ERROR, message: "Failed to fetch analytics" },
      500
    );
  }
}
