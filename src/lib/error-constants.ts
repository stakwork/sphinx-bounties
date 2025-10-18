import { ErrorCode } from "../types/error";

export const ERROR_MESSAGES: Record<ErrorCode | string, string> = {
  [ErrorCode.INTERNAL_SERVER_ERROR]: "An unexpected error occurred. Please try again later.",
  [ErrorCode.BAD_REQUEST]: "Invalid request. Please check your input.",
  [ErrorCode.UNAUTHORIZED]: "You are not authenticated. Please sign in.",
  [ErrorCode.FORBIDDEN]: "You do not have permission to access this resource.",
  [ErrorCode.NOT_FOUND]: "The requested resource was not found.",
  [ErrorCode.CONFLICT]: "This resource already exists.",
  [ErrorCode.VALIDATION_ERROR]: "Validation failed. Please check your input.",
  [ErrorCode.RATE_LIMIT]: "Too many requests. Please try again later.",
  [ErrorCode.SERVICE_UNAVAILABLE]: "Service is temporarily unavailable.",
  [ErrorCode.INVALID_CREDENTIALS]: "Invalid credentials. Please try again.",
  [ErrorCode.SESSION_EXPIRED]: "Your session has expired. Please sign in again.",
  [ErrorCode.PERMISSION_DENIED]: "Permission denied.",
  [ErrorCode.RESOURCE_NOT_FOUND]: "Resource not found.",
};

export const ERROR_STATUS_CODES: Record<ErrorCode | string, number> = {
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.VALIDATION_ERROR]: 422,
  [ErrorCode.RATE_LIMIT]: 429,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.SESSION_EXPIRED]: 401,
  [ErrorCode.PERMISSION_DENIED]: 403,
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
};
