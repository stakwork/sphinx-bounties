import type { NextRequest } from "next/server";
import { apiError, validateBody, apiSuccess, apiCreated } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";
import { db } from "@/lib/db";
import { AUTH_HEADER_NAME } from "@/lib/auth/constants";
import { WorkspaceRole, WorkspaceActivityAction } from "@prisma/client";
import { z } from "zod";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const addMemberSchema = z.object({
  userPubkey: z
    .string()
    .length(66, "Invalid pubkey format")
    .regex(/^[0-9a-f]{66}$/i, "Invalid pubkey format"),
  role: z.nativeEnum(WorkspaceRole).default(WorkspaceRole.CONTRIBUTOR),
});

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

    const members = await db.workspaceMember.findMany({
      where: {
        workspaceId: id,
      },
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
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    });

    return apiSuccess({ members });
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/workspaces/[id]/members`,
      method: "GET",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to fetch workspace members",
      },
      500
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
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

    const validation = await validateBody(request, addMemberSchema);

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
          message: "Only workspace owners and admins can add members",
        },
        403
      );
    }

    const userToAdd = await db.user.findUnique({
      where: { pubkey: body.userPubkey },
    });

    if (!userToAdd) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "User not found",
        },
        404
      );
    }

    const existingMember = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userPubkey: {
          workspaceId: id,
          userPubkey: body.userPubkey,
        },
      },
    });

    if (existingMember) {
      return apiError(
        {
          code: ErrorCode.CONFLICT,
          message: "User is already a member of this workspace",
        },
        409
      );
    }

    const newMember = await db.workspaceMember.create({
      data: {
        workspaceId: id,
        userPubkey: body.userPubkey,
        role: body.role,
      },
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
    });

    await db.workspaceActivity.create({
      data: {
        workspaceId: id,
        userPubkey: pubkey,
        action: WorkspaceActivityAction.MEMBER_ADDED,
        details: {
          action: "member_added",
          addedUserPubkey: body.userPubkey,
          role: body.role,
        },
      },
    });

    return apiCreated({ member: newMember });
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/workspaces/[id]/members`,
      method: "POST",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to add workspace member",
      },
      500
    );
  }
}
