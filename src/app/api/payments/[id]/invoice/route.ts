import type { NextRequest } from "next/server";
import { apiError } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";

/**
 * @swagger
 * /api/payments/{id}/invoice:
 *   post:
 *     tags: [Payments]
 *     summary: Create invoice for payment (stub)
 *     description: Not implemented in the stubbed implementation.
 */
export async function POST(request: NextRequest) {
  try {
    return apiError(
      {
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: "Invoice generation not implemented",
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
        message: "Failed to generate invoice",
      },
      500
    );
  }
}
