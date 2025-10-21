import type { NextRequest } from "next/server";
import { apiError, validateBody, apiCreated, apiPaginated } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";
import { db } from "@/lib/db";
import { createWorkspaceSchema } from "@/validations/workspace.schema";
import { AUTH_HEADER_NAME } from "@/lib/auth/constants";
import { WorkspaceRole, WorkspaceActivityAction, Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const pubkey = request.headers.get(AUTH_HEADER_NAME);

    if (!pubkey) {
      return apiError(
        {
          code: ErrorCode.UNAUTHORIZED,
          message: "Authentication required",
        },
        401
      );
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));
    const search = searchParams.get("search") || undefined;
    const ownedOnly = searchParams.get("owned") === "true";
    const roleFilter = searchParams.get("role") as WorkspaceRole | undefined;
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const skip = (page - 1) * pageSize;

    const where: Prisma.WorkspaceWhereInput = {
      deletedAt: null,
      members: {
        some: {
          userPubkey: pubkey,
          ...(ownedOnly && { role: WorkspaceRole.OWNER }),
          ...(roleFilter && { role: roleFilter }),
        },
      },
      ...(search && {
        name: {
          contains: search,
          mode: "insensitive" as Prisma.QueryMode,
        },
      }),
    };

    const orderBy: Prisma.WorkspaceOrderByWithRelationInput =
      sortBy === "name" ? { name: sortOrder } : { createdAt: sortOrder };

    const [workspaces, totalCount] = await Promise.all([
      db.workspace.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          budget: true,
          members: {
            where: { userPubkey: pubkey },
            select: { role: true, joinedAt: true },
          },
          _count: {
            select: {
              members: true,
              bounties: { where: { deletedAt: null } },
            },
          },
        },
      }),
      db.workspace.count({ where }),
    ]);

    const data = workspaces.map((ws) => ({
      ...ws,
      role: ws.members[0].role,
      joinedAt: ws.members[0].joinedAt,
      memberCount: ws._count.members,
      bountyCount: ws._count.bounties,
      budget: ws.budget
        ? {
            ...ws.budget,
            totalBudget: ws.budget.totalBudget.toString(),
            availableBudget: ws.budget.availableBudget.toString(),
            reservedBudget: ws.budget.reservedBudget.toString(),
            paidBudget: ws.budget.paidBudget.toString(),
          }
        : null,
      members: undefined,
      _count: undefined,
    }));

    return apiPaginated(data, {
      page,
      pageSize,
      totalCount,
    });
  } catch (error) {
    logApiError(error as Error, {
      url: "/api/workspaces",
      method: "GET",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to fetch workspaces",
      },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const pubkey = request.headers.get(AUTH_HEADER_NAME);

    if (!pubkey) {
      return apiError(
        {
          code: ErrorCode.UNAUTHORIZED,
          message: "Authentication required",
        },
        401
      );
    }

    const validation = await validateBody(request, createWorkspaceSchema);

    if (validation.error) {
      return validation.error;
    }

    const body = validation.data!;

    const user = await db.user.findUnique({
      where: { pubkey },
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

    const workspace = await db.workspace.create({
      data: {
        name: body.name,
        description: body.description || null,
        mission: body.mission || null,
        avatarUrl: body.avatarUrl || null,
        websiteUrl: body.websiteUrl || null,
        githubUrl: body.githubUrl || null,
        ownerPubkey: pubkey,
        budget: {
          create: {
            totalBudget: 0,
            availableBudget: 0,
            reservedBudget: 0,
            paidBudget: 0,
          },
        },
        members: {
          create: {
            userPubkey: pubkey,
            role: WorkspaceRole.OWNER,
          },
        },
        activities: {
          create: {
            userPubkey: pubkey,
            action: WorkspaceActivityAction.SETTINGS_UPDATED,
            details: {
              action: "workspace_created",
              workspaceName: body.name,
            },
          },
        },
      },
      include: {
        budget: true,
        members: { where: { userPubkey: pubkey } },
      },
    });

    return apiCreated({
      workspace: {
        ...workspace,
        budget: workspace.budget
          ? {
              ...workspace.budget,
              totalBudget: workspace.budget.totalBudget.toString(),
              availableBudget: workspace.budget.availableBudget.toString(),
              reservedBudget: workspace.budget.reservedBudget.toString(),
              paidBudget: workspace.budget.paidBudget.toString(),
            }
          : null,
        role: workspace.members[0].role,
        joinedAt: workspace.members[0].joinedAt,
        memberCount: 1,
        bountyCount: 0,
        members: undefined,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return apiError(
          {
            code: ErrorCode.CONFLICT,
            message: "A workspace with this name already exists",
          },
          409
        );
      }
    }

    logApiError(error as Error, {
      url: "/api/workspaces",
      method: "POST",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to create workspace",
      },
      500
    );
  }
}
