import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import type { WorkspaceActivityAction } from "@prisma/client";
import type { ApiResponse } from "@/types/api";

interface Activity {
  id: string;
  action: WorkspaceActivityAction;
  details: unknown;
  timestamp: string;
  user: {
    pubkey: string;
    username: string;
    alias: string | null;
  };
}

interface ActivitiesResponse {
  activities: Activity[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

/**
 * GET /api/workspaces/[id]/activities
 * List all workspace activity logs with pagination and filtering
 * @permission All members can view activities
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ActivitiesResponse>>> {
  try {
    const { id: workspaceId } = await params;
    const userPubkey = request.headers.get("x-user-pubkey");

    // Authentication check
    if (!userPubkey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 401 }
      );
    }

    // Check workspace membership
    const workspace = await db.workspace.findUnique({
      where: {
        id: workspaceId,
        deletedAt: null,
      },
      include: {
        members: {
          where: {
            userPubkey,
          },
        },
      },
    });

    if (!workspace || workspace.members.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Workspace not found or you are not a member",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 404 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("perPage") || "20")));
    const action = searchParams.get("action") as WorkspaceActivityAction | null;

    // Build where clause
    const where = {
      workspaceId,
      ...(action && { action }),
    };

    // Get total count and activities
    const [total, activities] = await Promise.all([
      db.workspaceActivity.count({ where }),
      db.workspaceActivity.findMany({
        where,
        include: {
          user: {
            select: {
              pubkey: true,
              username: true,
              alias: true,
            },
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    const totalPages = Math.ceil(total / perPage);

    return NextResponse.json(
      {
        success: true,
        data: {
          activities: activities.map((a) => ({
            id: a.id,
            action: a.action,
            details: a.details,
            timestamp: a.timestamp.toISOString(),
            user: a.user,
          })),
          pagination: {
            page,
            perPage,
            total,
            totalPages,
          },
        },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Activities list error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 500 }
    );
  }
}
