import type { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { generateChallenge, encodeLnurl } from "@/lib/auth/lnurl";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { ErrorCode } from "@/types/error";
import { logApiError } from "@/lib/errors/logger";

export async function POST(request: NextRequest) {
  try {
    const host = request.headers.get("host") ?? new URL(env.NEXT_PUBLIC_APP_URL).host;
    const protocol = host.includes("localhost") ? "http" : "https";

    const k1 = generateChallenge();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.authChallenge.create({
      data: {
        k1,
        expiresAt,
        used: false,
      },
    });

    const callbackUrl = `${protocol}://${host}/api/auth/verify?tag=login&k1=${k1}&action=login`;
    const lnurl = encodeLnurl(callbackUrl);

    return apiSuccess(
      {
        k1,
        lnurl,
        expiresAt: expiresAt.toISOString(),
      },
      { requestId: request.headers.get("x-request-id") ?? undefined }
    );
  } catch (error) {
    logApiError(error as Error, {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to generate authentication challenge",
      },
      500
    );
  }
}
