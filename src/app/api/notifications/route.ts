import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { NotificationType } from "@prisma/client";
import { apiError, apiSuccess, apiPaginated, validateQuery } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";
import type { Prisma } from "@prisma/client";

const listNotificationsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  unreadOnly: z.coerce.boolean().optional(),
  type: z.nativeEnum(NotificationType).optional(),
});

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const validation = validateQuery(searchParams, listNotificationsSchema);

    if (validation.error) {
      return validation.error;
    }

    const query = validation.data!;

    const where: Prisma.NotificationWhereInput = {
      userPubkey,
    };

    if (query.unreadOnly) {
      where.read = false;
    }

    if (query.type) {
      where.type = query.type;
    }

    const skip = (query.page - 1) * query.limit;

    const [total, notifications] = await Promise.all([
      db.notification.count({ where }),
      db.notification.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    return apiPaginated(
      notifications.map((notification) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        relatedEntityType: notification.relatedEntityType,
        relatedEntityId: notification.relatedEntityId,
        read: notification.read,
        createdAt: notification.createdAt.toISOString(),
      })),
      {
        page: query.page,
        pageSize: query.limit,
        totalCount: total,
      }
    );
  } catch (error) {
    logApiError(error as Error, {
      url: "/api/notifications",
      method: "GET",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to fetch notifications",
      },
      500
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    const result = await db.notification.updateMany({
      where: {
        userPubkey,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return apiSuccess({
      message: "All notifications marked as read",
      count: result.count,
    });
  } catch (error) {
    logApiError(error as Error, {
      url: "/api/notifications",
      method: "PATCH",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to mark notifications as read",
      },
      500
    );
  }
}
