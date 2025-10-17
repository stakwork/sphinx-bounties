export enum ErrorCode {
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RATE_LIMIT = "RATE_LIMIT",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
}

export interface ApiError {
  code: ErrorCode | string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
  timestamp?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ValidationErrorDetails {
  field: string;
  message: string;
  value?: unknown;
}
