import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api";
import { verifySignature } from "@/lib/auth/lnurl";
import { db } from "@/lib/db";
import { ErrorCode } from "@/types/error";
import { logApiError } from "@/lib/errors/logger";

const sphinxVerifySchema = z.object({
  verification_signature: z.string().min(1, "Signature is required"),
  pubkey: z.string().regex(/^[0-9a-f]{66}$/i, "Invalid public key format"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ challenge: string }> }
) {
  try {
    const { challenge } = await params;

    let verification_signature: string | null = null;
    let pubkey: string | null = null;

    try {
      const body = await request.json();
      verification_signature = body.verification_signature || body.sig || null;
      pubkey = body.pubkey || body.key || null;
    } catch {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Invalid request body",
        },
        400
      );
    }

    if (!verification_signature || !pubkey) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Missing verification_signature or pubkey",
        },
        400
      );
    }

    const validation = sphinxVerifySchema.safeParse({ verification_signature, pubkey });
    if (!validation.success) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: validation.error.issues[0]?.message || "Invalid parameters",
        },
        400
      );
    }

    const { verification_signature: validSig } = validation.data;

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

    const verified = await verifySignature(challenge, validSig);

    if (!verified) {
      return apiError(
        {
          code: ErrorCode.INVALID_CREDENTIALS,
          message: "Invalid signature",
        },
        401
      );
    }

    // Use the recovered pubkey from the signature (this is the actual signing key)
    const recoveredPubkey = verified.pubkey;

    const user = await db.user.upsert({
      where: { pubkey: recoveredPubkey },
      create: {
        pubkey: recoveredPubkey,
        username: `user_${recoveredPubkey.substring(0, 8)}`,
        lastLogin: new Date(),
      },
      update: {
        lastLogin: new Date(),
      },
    });

    await db.authChallenge.update({
      where: { k1: challenge },
      data: { pubkey: recoveredPubkey },
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
