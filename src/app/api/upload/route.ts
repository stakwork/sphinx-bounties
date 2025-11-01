import type { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";
import { AUTH_HEADER_NAME } from "@/lib/auth/constants";
import { validateImageFile, uploadImage } from "@/lib/utils/upload";

export async function POST(request: NextRequest) {
  try {
    const pubkey = request.headers.get(AUTH_HEADER_NAME);

    if (!pubkey) {
      return apiError(
        {
          code: ErrorCode.UNAUTHORIZED,
          message: "Authentication required",
        },
        401
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: "No file provided",
        },
        400
      );
    }

    const validation = validateImageFile(file);
    if (!validation.valid) {
      return apiError(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: validation.error || "Invalid file",
        },
        400
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadImage(buffer, file.name, file.type);

    return apiSuccess({ url });
  } catch (error) {
    logApiError(error as Error, {
      url: "/api/upload",
      method: "POST",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to upload file",
      },
      500
    );
  }
}
