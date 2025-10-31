import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { ErrorCode } from "@/types/error";
import { logApiError } from "@/lib/errors/logger";

const sphinxPersonSchema = z.object({
  pubkey: z.string().regex(/^[0-9a-f]{66}$/i, "Invalid public key format"),
  alias: z.string().optional().nullable(),
  photo_url: z.string().url().optional().nullable(),
  route_hint: z.string().optional().nullable(),
  price_to_meet: z.number().optional().nullable(),
});

async function handlePersonRequest(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Invalid request body",
        },
        400
      );
    }

    const validation = sphinxPersonSchema.safeParse(body);

    if (!validation.success) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: validation.error.issues[0]?.message || "Invalid request data",
        },
        400
      );
    }

    const { pubkey, alias, photo_url, route_hint, price_to_meet } = validation.data;

    const user = await db.user.upsert({
      where: { pubkey },
      create: {
        pubkey,
        username: alias || `user_${pubkey.slice(0, 8)}`,
        alias: alias || null,
        routeHint: route_hint || null,
        avatarUrl: photo_url || null,
        priceToMeet: price_to_meet || null,
        lastLogin: new Date(),
      },
      update: {
        alias: alias || undefined,
        routeHint: route_hint || undefined,
        avatarUrl: photo_url || undefined,
        priceToMeet: price_to_meet || undefined,
        lastLogin: new Date(),
      },
    });

    return apiSuccess({
      id: user.id,
      pubkey: user.pubkey,
      owner_alias: user.alias || user.username,
      photo_url: user.avatarUrl || "",
      description: user.description || "",
      price_to_meet: user.priceToMeet || 0,
    });
  } catch (error) {
    logApiError(error as Error, {
      url: request.url,
      method: request.method,
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to get user info",
      },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  return handlePersonRequest(request);
}
