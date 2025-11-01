import type { NextRequest } from "next/server";
import { apiError, validateBody, apiSuccess, apiCreated } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";
import { db } from "@/lib/db";
import { AUTH_HEADER_NAME } from "@/lib/auth/constants";
import { WorkspaceRole, WorkspaceActivityAction } from "@prisma/client";
import { z } from "zod";
import type { ListMembersResponse, AddMemberResponse } from "@/types/workspace";

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

/**
 * @swagger
 * /api/workspaces/{id}/members:
 *   get:
 *     tags: [Workspaces]
 *     summary: List workspace members
 *     description: Get list of all members in a workspace
 *     security:
 *       - NostrAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of workspace members
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Workspace not found
 *   post:
 *     tags: [Workspaces]
 *     summary: Add member to workspace
 *     description: Add a new member to workspace (admin/owner only)
 *     security:
 *       - NostrAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userPubkey
 *             properties:
 *               userPubkey:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [OWNER, ADMIN, CONTRIBUTOR, VIEWER]
 *                 default: CONTRIBUTOR
 *     responses:
 *       201:
 *         description: Member added successfully
 *       400:
 *         description: Validation error or member already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Workspace or user not found
 */
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

    const response: ListMembersResponse = members.map((m) => ({
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
    }));

    return apiSuccess(response);
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

    const response: AddMemberResponse = {
      id: newMember.id,
      workspaceId: newMember.workspaceId,
      userPubkey: newMember.userPubkey,
      role: newMember.role,
      joinedAt: newMember.joinedAt.toISOString(),
      user: {
        pubkey: newMember.user.pubkey,
        username: newMember.user.username,
        alias: newMember.user.alias,
        avatarUrl: newMember.user.avatarUrl,
      },
    };

    return apiCreated(response);
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
