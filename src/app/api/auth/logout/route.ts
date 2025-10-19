import { apiSuccess, apiError } from "@/lib/api";
import { clearSessionCookie } from "@/lib/auth/session";
import { ErrorCode } from "@/types/error";
import { logError } from "@/lib/errors/logger";

export async function POST() {
  try {
    clearSessionCookie();

    return apiSuccess({ message: "Logged out successfully" });
  } catch (error) {
    logError(error as Error, { context: "logout" });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Logout failed",
      },
      500
    );
  }
}
