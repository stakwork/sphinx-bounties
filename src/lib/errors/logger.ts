import { AppError } from './base';

interface LogContext {
  userId?: string;
  requestId?: string;
  url?: string;
  method?: string;
  [key: string]: unknown;
}

export function logError(
  error: Error | AppError,
  context?: LogContext
): void {
  const isAppError = error instanceof AppError;
  const isOperational = isAppError ? error.isOperational : false;

  const logData = {
    timestamp: new Date().toISOString(),
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...(isAppError && {
      code: error.code,
      statusCode: error.statusCode,
      metadata: error.metadata,
      isOperational,
    }),
    ...context,
  };

  if (!isOperational) {
    console.error('[CRITICAL ERROR]', logData);
  } else if (isAppError && error.statusCode >= 500) {
    console.error('[SERVER ERROR]', logData);
  } else if (isAppError && error.statusCode >= 400) {
    console.warn('[CLIENT ERROR]', logData);
  } else {
    console.log('[ERROR]', logData);
  }

  if (process.env.NODE_ENV === 'production') {
    console.error("[ERROR]", logData);
    // TODO: Send to error tracking service (Sentry, DataDog, etc.)
  }
}

export function logApiError(
  error: Error | AppError,
  request: {
    url: string;
    method: string;
    headers?: Record<string, string>;
  }
): void {
  logError(error, {
    url: request.url,
    method: request.method,
    userAgent: request.headers?.['user-agent'],
  });
}
