import type { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";

export async function GET(request: NextRequest) {
  try {
    // Return a minimal stats payload as a placeholder
    return apiSuccess({
      usersCount: 0,
      bountiesCount: 0,
      totalPaidSats: 0,
    });
  } catch (error) {
    logApiError(error as Error, {
      url: request.url,
      method: request.method,
    });
    return apiError(
      { code: ErrorCode.INTERNAL_SERVER_ERROR, message: "Failed to fetch admin stats" },
      500
    );
  }
}
