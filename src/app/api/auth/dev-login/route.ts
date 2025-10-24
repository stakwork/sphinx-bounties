import type { NextRequest } from "next/server";
import { apiSuccess, apiError, validateBody } from "@/lib/api";
import { setSessionCookie } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ErrorCode } from "@/types/error";
import { logApiError } from "@/lib/errors/logger";
import { z } from "zod";

const devLoginSchema = z.object({
  pubkey: z.string().regex(/^[0-9a-f]{66}$/i, "Invalid public key format"),
});

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return apiError(
      {
        code: ErrorCode.FORBIDDEN,
        message: "Dev login only available in development mode",
      },
      403
    );
  }

  try {
    const { data: bodyData, error: validationError } = await validateBody(request, devLoginSchema);

    if (validationError) {
      return validationError;
    }

    const { pubkey } = bodyData!;

    let user = await db.user.findUnique({
      where: { pubkey },
    });

    if (!user) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "User not found. Run seed script first.",
        },
        404
      );
    }

    user = await db.user.update({
      where: { pubkey },
      data: { lastLogin: new Date() },
    });

    const token = await setSessionCookie(user.pubkey);

    return apiSuccess({
      user: {
        id: user.id,
        pubkey: user.pubkey,
        username: user.username,
        alias: user.alias,
        avatarUrl: user.avatarUrl,
      },
      token,
    });
  } catch (error) {
    logApiError(error as Error, {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Dev login failed",
      },
      500
    );
  }
}
