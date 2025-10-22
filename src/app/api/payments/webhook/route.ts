import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api";
import { ErrorCode } from "@/types/error";
import { logApiError } from "@/lib/errors/logger";

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Lightning payment webhook
 *     description: Receives Lightning payment confirmations from external node
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentHash:
 *                 type: string
 *               preimage:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [COMPLETED, FAILED]
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
export async function POST(request: NextRequest) {
  try {
    return apiSuccess({ message: "Webhook received" });
  } catch (error) {
    logApiError(error as Error, {
      url: request.url,
      method: request.method,
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Webhook processing failed",
      },
      500
    );
  }
}
