import { ApiError, ApiResponse, ErrorCode } from "../types/error";
import { ERROR_MESSAGES, ERROR_STATUS_CODES } from "./error-constants";

export interface AppErrorOptions {
  code: ErrorCode | string;
  message?: string;
  details?: Record<string, unknown>;
}

export function createAppError(options: AppErrorOptions): ApiError & { statusCode: number } {
  const { code, message, details } = options;
  return {
    code,
    message: message || ERROR_MESSAGES[code] || "An error occurred",
    statusCode: ERROR_STATUS_CODES[code] || 500,
    details,
    timestamp: new Date().toISOString(),
  };
}

export function createApiError(
  code: ErrorCode | string,
  message?: string,
  details?: Record<string, unknown>
): ApiError {
  return {
    code,
    message: message || ERROR_MESSAGES[code] || "An error occurred",
    statusCode: ERROR_STATUS_CODES[code] || 500,
    details,
    timestamp: new Date().toISOString(),
  };
}

export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

export function createErrorResponse<T = unknown>(
  error: ApiError
): ApiResponse<T> {
  return {
    success: false,
    error,
  };
}

export function handleApiError(error: unknown): ApiError {
  if (error && typeof error === "object" && "code" in error) {
    const appError = error as ApiError & { statusCode?: number };
    return createApiError(
      appError.code,
      appError.message || ERROR_MESSAGES[appError.code],
      appError.details
    );
  }

  if (error instanceof Error) {
    return createApiError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      error.message
    );
  }

  return createApiError(
    ErrorCode.INTERNAL_SERVER_ERROR,
    "An unexpected error occurred"
  );
}

export function getStatusCode(error: unknown): number {
  if (error && typeof error === "object" && "statusCode" in error) {
    return (error as { statusCode: number }).statusCode;
  }
  return 500;
}
