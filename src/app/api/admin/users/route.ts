import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiPaginated, apiError, validateQuery } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";

const listUsersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const validation = validateQuery(searchParams, listUsersSchema);
    if (validation.error) return validation.error;

    const q = validation.data!;

    // Return empty list as a safe stub
    return apiPaginated([], {
      page: q.page,
      pageSize: q.limit,
      totalCount: 0,
    });
  } catch (error) {
    logApiError(error as Error, {
      url: request.url,
      method: request.method,
    });
    return apiError(
      { code: ErrorCode.INTERNAL_SERVER_ERROR, message: "Failed to list users" },
      500
    );
  }
}
