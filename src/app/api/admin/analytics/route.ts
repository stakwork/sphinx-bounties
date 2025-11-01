import type { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";

type TimeRange = "7d" | "30d" | "90d" | "all";

interface DailyData {
  date: string;
  users: number;
  bounties: number;
  workspaces: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = (searchParams.get("timeRange") as TimeRange) || "30d";

    const daysMap: Record<TimeRange, number | null> = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      all: null,
    };

    const days = daysMap[timeRange];
    const startDate = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : new Date(0);

    const [
      usersCount,
      workspacesCount,
      bountiesCount,
      openBountiesCount,
      usersByDay,
      bountiesByDay,
      workspacesByDay,
    ] = await Promise.all([
      db.user.count(),
      db.workspace.count(),
      db.bounty.count(),
      db.bounty.count({ where: { status: "OPEN" } }),
      db.$queryRaw<DailyData[]>`
        SELECT 
          DATE("createdAt") as date,
          COUNT(*)::int as users,
          0 as bounties,
          0 as workspaces
        FROM "User"
        WHERE "createdAt" >= ${startDate}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
      db.$queryRaw<DailyData[]>`
        SELECT 
          DATE("createdAt") as date,
          0 as users,
          COUNT(*)::int as bounties,
          0 as workspaces
        FROM "Bounty"
        WHERE "createdAt" >= ${startDate}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
      db.$queryRaw<DailyData[]>`
        SELECT 
          DATE("createdAt") as date,
          0 as users,
          0 as bounties,
          COUNT(*)::int as workspaces
        FROM "Workspace"
        WHERE "createdAt" >= ${startDate}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
    ]);

    const dailyDataMap = new Map<string, DailyData>();

    [usersByDay, bountiesByDay, workspacesByDay].forEach((dataset) => {
      dataset.forEach((row) => {
        const dateValue = row.date as Date | string;
        const dateStr =
          typeof dateValue === "string" ? dateValue : dateValue.toISOString().split("T")[0];

        const existing = dailyDataMap.get(dateStr) || {
          date: dateStr,
          users: 0,
          bounties: 0,
          workspaces: 0,
        };
        dailyDataMap.set(dateStr, {
          date: dateStr,
          users: existing.users + row.users,
          bounties: existing.bounties + row.bounties,
          workspaces: existing.workspaces + row.workspaces,
        });
      });
    });

    const chartData = Array.from(dailyDataMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return apiSuccess({
      summary: {
        totalUsers: usersCount,
        totalWorkspaces: workspacesCount,
        totalBounties: bountiesCount,
        openBounties: openBountiesCount,
      },
      chartData,
      timeRange,
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
