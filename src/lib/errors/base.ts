import { ErrorCode } from '@/types/error';
import { ERROR_MESSAGES, ERROR_STATUS_CODES } from '@/lib/error-constants';


export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode | string;
  public readonly isOperational: boolean;
  public readonly metadata?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(
    code: ErrorCode | string,
    message?: string,
    statusCode?: number,
    isOperational = true,
    metadata?: Record<string, unknown>
  ) {
    const errorMessage = message || ERROR_MESSAGES[code] || 'An error occurred';
    super(errorMessage);

    this.name = this.constructor.name;
    this.code = code;
    this.message = errorMessage;
    this.statusCode = statusCode || ERROR_STATUS_CODES[code] || 500;
    this.isOperational = isOperational;
    this.metadata = metadata;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.metadata,
      timestamp: this.timestamp,
    };
  }


  toApiError() {
    return {
      code: this.code,
      message: this.message,
      details: this.metadata,
    };
  }

  log(){
    console.error(`[${this.timestamp}] ${this.name}: ${this.message}`, this.metadata);
  }
}
