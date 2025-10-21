import type { NextRequest } from "next/server";
import { apiError, validateBody, apiSuccess } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";
import { db } from "@/lib/db";
import { updateWorkspaceSchema } from "@/validations/workspace.schema";
import { AUTH_HEADER_NAME } from "@/lib/auth/constants";
import { WorkspaceRole, WorkspaceActivityAction, Prisma } from "@prisma/client";
import type {
  WorkspaceDetailsResponse,
  UpdateWorkspaceResponse,
  DeleteWorkspaceResponse,
} from "@/types/workspace";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
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

    const { id } = await context.params;

    const workspace = await db.workspace.findFirst({
      where: {
        id,
        deletedAt: null,
        members: {
          some: { userPubkey: pubkey },
        },
      },
      include: {
        budget: true,
        members: {
          include: {
            user: {
              select: {
                pubkey: true,
                username: true,
                alias: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        _count: {
          select: {
            bounties: { where: { deletedAt: null } },
            activities: true,
          },
        },
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

    const userMember = workspace.members.find((m) => m.userPubkey === pubkey);

    const response: { workspace: WorkspaceDetailsResponse } = {
      workspace: {
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
        role: userMember?.role || WorkspaceRole.VIEWER,
        memberCount: workspace.members.length,
        bountyCount: workspace._count.bounties,
        activityCount: workspace._count.activities,
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
        members: workspace.members.map((m) => ({
          id: m.id,
          workspaceId: m.workspaceId,
          userPubkey: m.userPubkey,
          role: m.role,
          joinedAt: m.joinedAt.toISOString(),
          user: {
            pubkey: m.user.pubkey,
            username: m.user.username,
            alias: m.user.alias,
            avatarUrl: m.user.avatarUrl,
          },
        })),
      },
    };

    return apiSuccess(response);
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/workspaces/[id]`,
      method: "GET",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to fetch workspace",
      },
      500
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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

    const { id } = await context.params;

    const validation = await validateBody(request, updateWorkspaceSchema.omit({ id: true }));

    if (validation.error) {
      return validation.error;
    }

    const body = validation.data!;

    const member = await db.workspaceMember.findFirst({
      where: {
        workspaceId: id,
        userPubkey: pubkey,
        workspace: { deletedAt: null },
      },
    });

    if (!member) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Workspace not found",
        },
        404
      );
    }

    if (member.role !== WorkspaceRole.OWNER && member.role !== WorkspaceRole.ADMIN) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "Only workspace owners and admins can update workspace settings",
        },
        403
      );
    }

    const updateData: Prisma.WorkspaceUpdateInput = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.mission !== undefined) updateData.mission = body.mission || null;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl || null;
    if (body.websiteUrl !== undefined) updateData.websiteUrl = body.websiteUrl || null;
    if (body.githubUrl !== undefined) updateData.githubUrl = body.githubUrl || null;

    const workspace = await db.workspace.update({
      where: { id },
      data: {
        ...updateData,
        activities: {
          create: {
            userPubkey: pubkey,
            action: WorkspaceActivityAction.SETTINGS_UPDATED,
            details: {
              action: "workspace_updated",
              changes: Object.keys(updateData),
            },
          },
        },
      },
      include: {
        budget: true,
        members: {
          where: { userPubkey: pubkey },
        },
      },
    });

    const response: UpdateWorkspaceResponse = {
      workspace: {
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
      },
    };

    return apiSuccess(response);
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
      url: `/api/workspaces/[id]`,
      method: "PATCH",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to update workspace",
      },
      500
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
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

    const { id } = await context.params;

    const member = await db.workspaceMember.findFirst({
      where: {
        workspaceId: id,
        userPubkey: pubkey,
        workspace: { deletedAt: null },
      },
    });

    if (!member) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Workspace not found",
        },
        404
      );
    }

    if (member.role !== WorkspaceRole.OWNER) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "Only workspace owners can delete workspaces",
        },
        403
      );
    }

    await db.workspace.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        activities: {
          create: {
            userPubkey: pubkey,
            action: WorkspaceActivityAction.SETTINGS_UPDATED,
            details: {
              action: "workspace_deleted",
            },
          },
        },
      },
    });

    const response: DeleteWorkspaceResponse = {
      message: "Workspace deleted successfully",
    };

    return apiSuccess(response);
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/workspaces/[id]`,
      method: "DELETE",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to delete workspace",
      },
      500
    );
  }
}
