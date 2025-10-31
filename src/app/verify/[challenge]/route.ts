import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api";
import { verifySphinxToken } from "@/lib/auth/lnurl";
import { db } from "@/lib/db";
import { ErrorCode } from "@/types/error";
import { logApiError } from "@/lib/errors/logger";

const sphinxVerifySchema = z.object({
  pubkey: z.string().regex(/^[0-9a-f]{66}$/i, "Invalid public key format"),
  alias: z.string().optional().nullable(),
  photo_url: z.string().url().optional().nullable(),
  route_hint: z.string().optional().nullable(),
  price_to_meet: z.number().optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ challenge: string }> }
) {
  try {
    const { challenge } = await params;

    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Missing token parameter",
        },
        400
      );
    }

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

    const { pubkey, alias, photo_url, route_hint, price_to_meet } = body;

    if (!pubkey) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Missing pubkey in request body",
        },
        400
      );
    }

    const validation = sphinxVerifySchema.safeParse({
      pubkey,
      alias,
      photo_url,
      route_hint,
      price_to_meet,
    });

    if (!validation.success) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: validation.error.issues[0]?.message || "Invalid parameters",
        },
        400
      );
    }

    const authChallenge = await db.authChallenge.findUnique({
      where: { k1: challenge },
    });

    if (!authChallenge) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Challenge not found or expired",
        },
        404
      );
    }

    if (authChallenge.used) {
      return apiError(
        {
          code: ErrorCode.BAD_REQUEST,
          message: "Challenge already used",
        },
        400
      );
    }

    if (authChallenge.expiresAt < new Date()) {
      return apiError(
        {
          code: ErrorCode.BAD_REQUEST,
          message: "Challenge expired",
        },
        400
      );
    }

    const isValid = await verifySphinxToken(token, pubkey, true);

    if (!isValid) {
      return apiError(
        {
          code: ErrorCode.INVALID_CREDENTIALS,
          message: "Invalid token signature",
        },
        401
      );
    }

    const user = await db.user.upsert({
      where: { pubkey },
      create: {
        pubkey,
        username: alias || `user_${pubkey.substring(0, 8)}`,
        alias: alias || null,
        avatarUrl: photo_url || null,
        routeHint: route_hint || null,
        priceToMeet: price_to_meet || null,
        lastLogin: new Date(),
      },
      update: {
        alias: alias || undefined,
        avatarUrl: photo_url || undefined,
        routeHint: route_hint || undefined,
        priceToMeet: price_to_meet || undefined,
        lastLogin: new Date(),
      },
    });

    await db.authChallenge.update({
      where: { k1: challenge },
      data: { pubkey, used: true },
    });

    return apiSuccess({
      status: "ok",
      pubkey: user.pubkey,
      alias: user.alias || user.username,
      photo_url: user.avatarUrl || "",
    });
  } catch (error) {
    logApiError(error as Error, {
      url: request.url,
      method: request.method,
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Authentication failed",
      },
      500
    );
  }
}
