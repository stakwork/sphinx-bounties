import type { NextRequest } from "next/server";
import { apiError, validateBody, apiSuccess } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";
import { db } from "@/lib/db";
import { AUTH_HEADER_NAME } from "@/lib/auth/constants";
import { WorkspaceRole, WorkspaceActivityAction } from "@prisma/client";
import { z } from "zod";
import type { UpdateMemberResponse, RemoveMemberResponse } from "@/types/workspace";

type RouteContext = {
  params: Promise<{ id: string; pubkey: string }>;
};

const updateRoleSchema = z.object({
  role: z.nativeEnum(WorkspaceRole),
});

/**
 * @swagger
 * /api/workspaces/{id}/members/{pubkey}:
 *   patch:
 *     tags: [Workspaces]
 *     summary: Update member role
 *     description: Update a workspace member's role (admin/owner only)
 *     security:
 *       - NostrAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: pubkey
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [OWNER, ADMIN, CONTRIBUTOR, VIEWER]
 *     responses:
 *       200:
 *         description: Member role updated successfully
 *       400:
 *         description: Invalid role or cannot modify owner
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Workspace or member not found
 *   delete:
 *     tags: [Workspaces]
 *     summary: Remove member from workspace
 *     description: Remove a member from workspace (admin/owner only)
 *     security:
 *       - NostrAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: pubkey
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       400:
 *         description: Cannot remove workspace owner
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Workspace or member not found
 */
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

    const { id, pubkey: targetPubkey } = await context.params;

    const validation = await validateBody(request, updateRoleSchema);

    if (validation.error) {
      return validation.error;
    }

    const body = validation.data!;

    const requesterMember = await db.workspaceMember.findFirst({
      where: {
        workspaceId: id,
        userPubkey: pubkey,
        workspace: { deletedAt: null },
      },
    });

    if (!requesterMember) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Workspace not found",
        },
        404
      );
    }

    if (
      requesterMember.role !== WorkspaceRole.OWNER &&
      requesterMember.role !== WorkspaceRole.ADMIN
    ) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "Only workspace owners and admins can update member roles",
        },
        403
      );
    }

    const targetMember = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userPubkey: {
          workspaceId: id,
          userPubkey: targetPubkey,
        },
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

    if (!targetMember) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Member not found",
        },
        404
      );
    }

    if (targetMember.role === WorkspaceRole.OWNER && body.role !== WorkspaceRole.OWNER) {
      const ownerCount = await db.workspaceMember.count({
        where: {
          workspaceId: id,
          role: WorkspaceRole.OWNER,
        },
      });

      if (ownerCount <= 1) {
        return apiError(
          {
            code: ErrorCode.BAD_REQUEST,
            message: "Cannot remove the last owner from the workspace",
          },
          400
        );
      }
    }

    const updatedMember = await db.workspaceMember.update({
      where: {
        workspaceId_userPubkey: {
          workspaceId: id,
          userPubkey: targetPubkey,
        },
      },
      data: {
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
        action: WorkspaceActivityAction.ROLE_CHANGED,
        details: {
          action: "member_role_updated",
          targetUserPubkey: targetPubkey,
          oldRole: targetMember.role,
          newRole: body.role,
        },
      },
    });

    const response: UpdateMemberResponse = {
      id: updatedMember.id,
      workspaceId: updatedMember.workspaceId,
      userPubkey: updatedMember.userPubkey,
      role: updatedMember.role,
      joinedAt: updatedMember.joinedAt.toISOString(),
      user: {
        pubkey: updatedMember.user.pubkey,
        username: updatedMember.user.username,
        alias: updatedMember.user.alias,
        avatarUrl: updatedMember.user.avatarUrl,
      },
    };

    return apiSuccess(response);
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/workspaces/[id]/members/[pubkey]`,
      method: "PATCH",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to update member role",
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

    const { id, pubkey: targetPubkey } = await context.params;

    const requesterMember = await db.workspaceMember.findFirst({
      where: {
        workspaceId: id,
        userPubkey: pubkey,
        workspace: { deletedAt: null },
      },
    });

    if (!requesterMember) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Workspace not found",
        },
        404
      );
    }

    if (
      requesterMember.role !== WorkspaceRole.OWNER &&
      requesterMember.role !== WorkspaceRole.ADMIN
    ) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "Only workspace owners and admins can remove members",
        },
        403
      );
    }

    const targetMember = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userPubkey: {
          workspaceId: id,
          userPubkey: targetPubkey,
        },
      },
    });

    if (!targetMember) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Member not found",
        },
        404
      );
    }

    if (targetMember.role === WorkspaceRole.OWNER) {
      const ownerCount = await db.workspaceMember.count({
        where: {
          workspaceId: id,
          role: WorkspaceRole.OWNER,
        },
      });

      if (ownerCount <= 1) {
        return apiError(
          {
            code: ErrorCode.BAD_REQUEST,
            message: "Cannot remove the last owner from the workspace",
          },
          400
        );
      }
    }

    await db.workspaceMember.delete({
      where: {
        workspaceId_userPubkey: {
          workspaceId: id,
          userPubkey: targetPubkey,
        },
      },
    });

    await db.workspaceActivity.create({
      data: {
        workspaceId: id,
        userPubkey: pubkey,
        action: WorkspaceActivityAction.MEMBER_REMOVED,
        details: {
          action: "member_removed",
          removedUserPubkey: targetPubkey,
          role: targetMember.role,
        },
      },
    });

    const response: RemoveMemberResponse = {
      message: "Member removed successfully",
    };

    return apiSuccess(response);
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/workspaces/[id]/members/[pubkey]`,
      method: "DELETE",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to remove member",
      },
      500
    );
  }
}
