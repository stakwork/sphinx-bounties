import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiPaginated, apiError, validateQuery } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";

const listInvitesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * @swagger
 * /api/workspaces/{id}/invites:
 *   get:
 *     tags: [Workspaces]
 *     summary: List workspace invites (stub)
 *     description: Returns an empty paginated list as a placeholder until invites are implemented.
 *   post:
 *     tags: [Workspaces]
 *     summary: Create workspace invite (stub)
 *     description: Not implemented in stubbed implementation.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const validation = validateQuery(searchParams, listInvitesSchema);

    if (validation.error) {
      return validation.error;
    }

    const query = validation.data!;

    return apiPaginated([], {
      page: query.page,
      pageSize: query.limit,
      totalCount: 0,
    });
  } catch (error) {
    logApiError(error as Error, {
      url: request.url,
      method: request.method,
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to list invites",
      },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return apiError(
      {
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: "Invite creation not implemented",
      },
      501
    );
  } catch (error) {
    logApiError(error as Error, {
      url: request.url,
      method: request.method,
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to create invite",
      },
      500
    );
  }
}
