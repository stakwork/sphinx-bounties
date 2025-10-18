import { AppError } from './base';
import { ErrorCode } from '@/types/error';

export class ValidationError extends AppError {
  constructor(message?: string, metadata?: Record<string, unknown>) {
    super(ErrorCode.VALIDATION_ERROR, message, undefined, true, metadata);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message?: string, metadata?: Record<string, unknown>) {
    super(ErrorCode.UNAUTHORIZED, message, undefined, true, metadata);
  }
}

export class ForbiddenError extends AppError {
  constructor(message?: string, metadata?: Record<string, unknown>) {
    super(ErrorCode.FORBIDDEN, message, undefined, true, metadata);
  }
}

export class NotFoundError extends AppError {
  constructor(resource?: string, metadata?: Record<string, unknown>) {
    const message = resource ? `${resource} not found` : undefined;
    super(ErrorCode.NOT_FOUND, message, undefined, true, metadata);
  }
}

export class ConflictError extends AppError {
  constructor(message?: string, metadata?: Record<string, unknown>) {
    super(ErrorCode.CONFLICT, message, undefined, true, metadata);
  }
}

export class RateLimitError extends AppError {
  constructor(message?: string, metadata?: Record<string, unknown>) {
    super(ErrorCode.RATE_LIMIT, message, undefined, true, metadata);
  }
}

export class InternalServerError extends AppError {
  constructor(message?: string, metadata?: Record<string, unknown>) {
    super(ErrorCode.INTERNAL_SERVER_ERROR, message, undefined, false, metadata);
  }
}

export class DatabaseError extends AppError {
  constructor(message?: string, metadata?: Record<string, unknown>) {
    super(ErrorCode.INTERNAL_SERVER_ERROR, message, 500, false, metadata);
  }
}

export class BadRequestError extends AppError {
  constructor(message?: string, metadata?: Record<string, unknown>) {
    super(ErrorCode.BAD_REQUEST, message, undefined, true, metadata);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message?: string, metadata?: Record<string, unknown>) {
    super(ErrorCode.SERVICE_UNAVAILABLE, message, undefined, true, metadata);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message?: string, metadata?: Record<string, unknown>) {
    super(ErrorCode.INVALID_CREDENTIALS, message, undefined, true, metadata);
  }
}

export class SessionExpiredError extends AppError {
  constructor(message?: string, metadata?: Record<string, unknown>) {
    super(ErrorCode.SESSION_EXPIRED, message, undefined, true, metadata);
  }
}

export class PermissionDeniedError extends AppError {
  constructor(message?: string, metadata?: Record<string, unknown>) {
    super(ErrorCode.PERMISSION_DENIED, message, undefined, true, metadata);
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(message?: string, metadata?: Record<string, unknown>) {
    super(ErrorCode.RESOURCE_NOT_FOUND, message, undefined, true, metadata);
  }
}
