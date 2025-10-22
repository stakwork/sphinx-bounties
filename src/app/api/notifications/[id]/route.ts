import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";

/**
 * @swagger
 * /api/notifications/{id}:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark notification as read
 *     description: Mark a single notification as read
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
 *         description: Notification marked as read
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Can only mark own notifications as read
 *       404:
 *         description: Notification not found
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete notification
 *     description: Delete a notification
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
 *         description: Notification deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Can only delete own notifications
 *       404:
 *         description: Notification not found
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: notificationId } = await params;
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

    const notification = await db.notification.findUnique({
      where: { id: notificationId },
      select: {
        userPubkey: true,
      },
    });

    if (!notification) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Notification not found",
        },
        404
      );
    }

    if (notification.userPubkey !== userPubkey) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "You can only mark your own notifications as read",
        },
        403
      );
    }

    await db.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return apiSuccess({
      message: "Notification marked as read",
    });
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/notifications/${notificationId}`,
      method: "PATCH",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to mark notification as read",
      },
      500
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: notificationId } = await params;
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

    const notification = await db.notification.findUnique({
      where: { id: notificationId },
      select: {
        userPubkey: true,
      },
    });

    if (!notification) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Notification not found",
        },
        404
      );
    }

    if (notification.userPubkey !== userPubkey) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "You can only delete your own notifications",
        },
        403
      );
    }

    await db.notification.delete({
      where: { id: notificationId },
    });

    return apiSuccess({
      message: "Notification deleted successfully",
    });
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/notifications/${notificationId}`,
      method: "DELETE",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to delete notification",
      },
      500
    );
  }
}
