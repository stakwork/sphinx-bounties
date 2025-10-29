import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, apiSuccess, validateQuery } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";
import type { Prisma } from "@prisma/client";

const usernameQuerySchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must not exceed 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .trim(),
});

/**
 * GET /api/users/username/available?username=...
 * Checks if a username is available (case-insensitive)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validation = validateQuery(searchParams, usernameQuerySchema);

    if (validation.error) return validation.error;

    const { username } = validation.data!;

    const existing = await db.user.findFirst({
      where: {
        username: { equals: username, mode: "insensitive" as Prisma.QueryMode },
      },
      select: { pubkey: true },
    });

    return apiSuccess({ available: !Boolean(existing) });
  } catch (error) {
    logApiError(error as Error, { url: "/api/users/username/available", method: "GET" });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to check username availability",
      },
      500
    );
  }
}
