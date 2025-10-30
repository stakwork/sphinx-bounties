import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api";
import { verifySignature } from "@/lib/auth/lnurl";
import { db } from "@/lib/db";
import { ErrorCode } from "@/types/error";
import { logApiError } from "@/lib/errors/logger";

const sphinxVerifySchema = z.object({
  sig: z.string().min(1, "Signature is required"),
  key: z.string().regex(/^[0-9a-f]{66}$/i, "Invalid public key format"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ challenge: string }> }
) {
  try {
    const { challenge } = await params;
    const { searchParams } = new URL(request.url);

    let sig = searchParams.get("sig");
    let key = searchParams.get("key");

    if (!sig || !key) {
      try {
        const body = await request.json();
        sig = body.verification_signature || body.sig || sig;
        key = body.pubkey || body.key || key;
      } catch {
        const contentType = request.headers.get("content-type");
        if (contentType?.includes("application/x-www-form-urlencoded")) {
          const formData = await request.formData();
          sig = formData.get("sig")?.toString() || sig;
          key = formData.get("key")?.toString() || key;
        }
      }
    }

    if (!sig || !key) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Missing sig or key parameters",
        },
        400
      );
    }

    const validation = sphinxVerifySchema.safeParse({ sig, key });
    if (!validation.success) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: validation.error.issues[0]?.message || "Invalid parameters",
        },
        400
      );
    }

    const { sig: validSig, key: validKey } = validation.data;

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

    const isValid = await verifySignature(challenge, validSig, validKey);

    if (!isValid) {
      return apiError(
        {
          code: ErrorCode.INVALID_CREDENTIALS,
          message: "Invalid signature",
        },
        401
      );
    }

    const user = await db.user.upsert({
      where: { pubkey: validKey },
      create: {
        pubkey: validKey,
        username: `user_${validKey.substring(0, 8)}`,
        lastLogin: new Date(),
      },
      update: {
        lastLogin: new Date(),
      },
    });

    await db.authChallenge.update({
      where: { k1: challenge },
      data: { pubkey: validKey },
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
