import type { NextRequest } from "next/server";
import { apiError, validateBody, apiCreated, apiPaginated } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";
import { db } from "@/lib/db";
import { createWorkspaceSchema } from "@/validations/workspace.schema";
import { AUTH_HEADER_NAME } from "@/lib/auth/constants";
import { WorkspaceRole, WorkspaceActivityAction, Prisma } from "@prisma/client";
import type { WorkspaceListItem, CreateWorkspaceResponse } from "@/types/workspace";

/**
 * @swagger
 * /api/workspaces:
 *   get:
 *     tags: [Workspaces]
 *     summary: List workspaces
 *     description: Get paginated list of workspaces the user is a member of
 *     security:
 *       - NostrAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: owned
 *         schema:
 *           type: boolean
 *         description: Filter for owned workspaces only
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [OWNER, ADMIN, CONTRIBUTOR, VIEWER]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Paginated list of workspaces
 *       401:
 *         description: Unauthorized
 *   post:
 *     tags: [Workspaces]
 *     summary: Create workspace
 *     description: Create a new workspace
 *     security:
 *       - NostrAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Workspace created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
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

    const data: WorkspaceListItem[] = workspaces.map((ws) => ({
      id: ws.id,
      name: ws.name,
      description: ws.description,
      mission: ws.mission,
      avatarUrl: ws.avatarUrl,
      websiteUrl: ws.websiteUrl,
      githubUrl: ws.githubUrl,
      ownerPubkey: ws.ownerPubkey,
      createdAt: ws.createdAt.toISOString(),
      updatedAt: ws.updatedAt.toISOString(),
      role: ws.members[0].role,
      joinedAt: ws.members[0].joinedAt.toISOString(),
      memberCount: ws._count.members,
      bountyCount: ws._count.bounties,
      budget: ws.budget
        ? {
            id: ws.budget.id,
            workspaceId: ws.budget.workspaceId,
            totalBudget: ws.budget.totalBudget.toString(),
            availableBudget: ws.budget.availableBudget.toString(),
            reservedBudget: ws.budget.reservedBudget.toString(),
            paidBudget: ws.budget.paidBudget.toString(),
            updatedAt: ws.budget.updatedAt.toISOString(),
          }
        : null,
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

    const response: CreateWorkspaceResponse = {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      mission: workspace.mission,
      avatarUrl: workspace.avatarUrl,
      websiteUrl: workspace.websiteUrl,
      githubUrl: workspace.githubUrl,
      ownerPubkey: workspace.ownerPubkey,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
      role: workspace.members[0].role,
      joinedAt: workspace.members[0].joinedAt.toISOString(),
      memberCount: 1,
      bountyCount: 0,
      budget: workspace.budget
        ? {
            id: workspace.budget.id,
            workspaceId: workspace.budget.workspaceId,
            totalBudget: workspace.budget.totalBudget.toString(),
            availableBudget: workspace.budget.availableBudget.toString(),
            reservedBudget: workspace.budget.reservedBudget.toString(),
            paidBudget: workspace.budget.paidBudget.toString(),
            updatedAt: workspace.budget.updatedAt.toISOString(),
          }
        : null,
    };

    return apiCreated(response);
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
