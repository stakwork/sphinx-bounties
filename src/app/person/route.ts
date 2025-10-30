import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { ErrorCode } from "@/types/error";
import { logApiError } from "@/lib/errors/logger";

const sphinxPersonSchema = z.object({
  pubkey: z.string().regex(/^[0-9a-f]{66}$/i, "Invalid public key format"),
});

async function handlePersonRequest(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    let pubkey = searchParams.get("pubkey") || searchParams.get("key");

    if (!pubkey) {
      try {
        const body = await request.json();
        pubkey = body.owner_pubkey || body.pubkey || body.key;
      } catch {
        const contentType = request.headers.get("content-type");
        if (contentType?.includes("application/x-www-form-urlencoded")) {
          const formData = await request.formData();
          const formPubkey = formData.get("pubkey")?.toString();
          const formKey = formData.get("key")?.toString();
          pubkey = formPubkey || formKey || null;
        }
      }
    }

    if (!pubkey) {
      console.error("Missing pubkey after all attempts");
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Missing pubkey parameter",
        },
        400
      );
    }

    const validation = sphinxPersonSchema.safeParse({ pubkey });
    if (!validation.success) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: validation.error.issues[0]?.message || "Invalid pubkey",
        },
        400
      );
    }

    const { pubkey: validPubkey } = validation.data;

    const user = await db.user.upsert({
      where: { pubkey: validPubkey },
      create: {
        pubkey: validPubkey,
        username: `user_${validPubkey.substring(0, 8)}`,
        lastLogin: new Date(),
      },
      update: {
        lastLogin: new Date(),
      },
    });

    return apiSuccess({
      id: user.id,
      pubkey: user.pubkey,
      owner_alias: user.alias || user.username,
      owner_pubkey: user.pubkey,
      alias: user.alias || user.username,
      photo_url: user.avatarUrl || "",
      description: user.description || "",
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

export async function GET(request: NextRequest) {
  return handlePersonRequest(request);
}
