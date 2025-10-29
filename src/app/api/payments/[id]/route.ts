import type { NextRequest } from "next/server";
import { apiError } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment by id (stub)
 *     description: Returns 404 for all payment ids as a placeholder.
 */
export async function GET(request: NextRequest) {
  try {
    return apiError(
      {
        code: ErrorCode.NOT_FOUND,
        message: "Payment not found",
      },
      404
    );
  } catch (error) {
    logApiError(error as Error, {
      url: request.url,
      method: request.method,
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to fetch payment",
      },
      500
    );
  }
}
