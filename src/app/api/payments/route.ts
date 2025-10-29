import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiPaginated, apiError, validateQuery } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";

const listPaymentsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * @swagger
 * /api/payments:
 *   get:
 *     tags: [Payments]
 *     summary: List payments (stub)
 *     description: Returns an empty paginated list. Placeholder until payments are implemented.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const validation = validateQuery(searchParams, listPaymentsSchema);

    if (validation.error) {
      return validation.error;
    }

    const query = validation.data!;

    // Return an empty paginated response as a harmless stub
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
        message: "Failed to list payments",
      },
      500
    );
  }
}
