import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { updateCommentSchema } from "@/validations/bounty.schema";
import { ErrorCode } from "@/types/error";
import { apiError, apiSuccess, validateBody } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { WorkspaceRole } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id: bountyId, commentId } = await params;
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

    const validation = await validateBody(request, updateCommentSchema.omit({ commentId: true }));

    if (validation.error) {
      return validation.error;
    }

    const { content } = validation.data!;

    const comment = await db.bountyComment.findUnique({
      where: {
        id: commentId,
        bountyId,
        deletedAt: null,
      },
      include: {
        bounty: {
          include: {
            workspace: {
              include: {
                members: {
                  where: { userPubkey },
                },
              },
            },
          },
        },
      },
    });

    if (!comment) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Comment not found",
        },
        404
      );
    }

    if (comment.authorPubkey !== userPubkey) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "You can only edit your own comments",
        },
        403
      );
    }

    const updatedComment = await db.bountyComment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
          select: {
            pubkey: true,
            username: true,
            alias: true,
            avatarUrl: true,
          },
        },
      },
    });

    return apiSuccess(updatedComment);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id: bountyId, commentId } = await params;
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

    const comment = await db.bountyComment.findUnique({
      where: {
        id: commentId,
        bountyId,
        deletedAt: null,
      },
      include: {
        bounty: {
          include: {
            workspace: {
              include: {
                members: {
                  where: { userPubkey },
                },
              },
            },
          },
        },
      },
    });

    if (!comment) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Comment not found",
        },
        404
      );
    }

    const member = comment.bounty.workspace.members[0];
    const isAuthor = comment.authorPubkey === userPubkey;
    const isAdmin =
      member && (member.role === WorkspaceRole.OWNER || member.role === WorkspaceRole.ADMIN);

    if (!isAuthor && !isAdmin) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "You can only delete your own comments or must be a workspace admin",
        },
        403
      );
    }

    await db.bountyComment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });

    return apiSuccess({ message: "Comment deleted successfully" });
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
