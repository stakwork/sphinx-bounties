import type { NextRequest } from "next/server";
import { apiSuccess, apiError, validateBody, validateQuery } from "@/lib/api";
import { verifySignature } from "@/lib/auth/lnurl";
import { setSessionCookie } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ErrorCode } from "@/types/error";
import { logApiError } from "@/lib/errors/logger";
import { z } from "zod";

const verifySchema = z.object({
  k1: z.string().length(64, "k1 must be 64 characters (32 bytes hex)"),
  sig: z.string().min(128, "Invalid signature format"),
  key: z.string().regex(/^[0-9a-f]{66}$/i, "Invalid public key format"),
});

export async function POST(request: NextRequest) {
  try {
    const { data: bodyData, error: validationError } = await validateBody(request, verifySchema);

    if (validationError) {
      return validationError;
    }

    const { k1, sig, key } = bodyData!;

    const challenge = await db.authChallenge.findUnique({
      where: { k1 },
    });

    if (!challenge) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Challenge not found or expired",
        },
        404
      );
    }

    if (challenge.used) {
      return apiError(
        {
          code: ErrorCode.BAD_REQUEST,
          message: "Challenge already used",
        },
        400
      );
    }

    if (challenge.expiresAt < new Date()) {
      return apiError(
        {
          code: ErrorCode.BAD_REQUEST,
          message: "Challenge expired",
        },
        400
      );
    }

    const isValid = await verifySignature(k1, sig, key);

    if (!isValid) {
      return apiError(
        {
          code: ErrorCode.INVALID_CREDENTIALS,
          message: "Invalid signature",
        },
        401
      );
    }

    await db.authChallenge.update({
      where: { k1 },
      data: { used: true },
    });

    let user = await db.user.findUnique({
      where: { pubkey: key },
    });

    if (!user) {
      const username = `user_${key.substring(0, 8)}`;

      user = await db.user.create({
        data: {
          pubkey: key,
          username,
          lastLogin: new Date(),
        },
      });
    } else {
      user = await db.user.update({
        where: { pubkey: key },
        data: { lastLogin: new Date() },
      });
    }

    const token = await setSessionCookie(user.pubkey);

    return apiSuccess(
      {
        user: {
          id: user.id,
          pubkey: user.pubkey,
          username: user.username,
          alias: user.alias,
          avatarUrl: user.avatarUrl,
        },
        token,
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
        message: "Authentication failed",
      },
      500
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const { data: queryData, error: validationError } = validateQuery(searchParams, verifySchema);

    if (validationError) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Invalid parameters",
        },
        400
      );
    }

    const { k1, sig, key } = queryData!;

    const challenge = await db.authChallenge.findUnique({
      where: { k1 },
    });

    if (!challenge || challenge.used || challenge.expiresAt < new Date()) {
      return apiError(
        {
          code: ErrorCode.BAD_REQUEST,
          message: "Invalid or expired challenge",
        },
        400
      );
    }

    const isValid = await verifySignature(k1, sig, key);
    if (!isValid) {
      return apiError(
        {
          code: ErrorCode.INVALID_CREDENTIALS,
          message: "Invalid signature",
        },
        401
      );
    }

    await db.authChallenge.update({
      where: { k1 },
      data: { used: true },
    });

    let user = await db.user.findUnique({
      where: { pubkey: key },
    });

    if (!user) {
      const username = `user_${key.substring(0, 8)}`;
      user = await db.user.create({
        data: {
          pubkey: key,
          username,
          lastLogin: new Date(),
        },
      });
    } else {
      await db.user.update({
        where: { pubkey: key },
        data: { lastLogin: new Date() },
      });
    }

    await setSessionCookie(user.pubkey);

    return apiSuccess({ status: "OK" });
  } catch (error) {
    logApiError(error as Error, {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
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
