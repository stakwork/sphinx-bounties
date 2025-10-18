import { AppError } from './base';
import {
  ValidationError,
  NotFoundError,
  DatabaseError,
  ConflictError,
} from './classes';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export function mapErrorToAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new ValidationError('Validation failed', {
      errors: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      })),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return new ConflictError('Unique constraint violation', {
          fields: error.meta?.target,
          prismaCode: error.code,
        });
      case 'P2025':
        return new NotFoundError('Record', {
          model: error.meta?.modelName,
          prismaCode: error.code,
        });
      case 'P2003':
        return new ValidationError('Foreign key constraint failed', {
          field: error.meta?.field_name,
          prismaCode: error.code,
        });
      case 'P2014':
        return new ValidationError('Required relation violation', {
          relation: error.meta?.relation_name,
          prismaCode: error.code,
        });
      default:
        return new DatabaseError(`Database error: ${error.code}`, {
          prismaCode: error.code,
          prismaMessage: error.message,
        });
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new ValidationError('Invalid query parameters', {
      prismaMessage: error.message,
    });
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new DatabaseError('Database connection failed', {
      prismaMessage: error.message,
    });
  }

  if (error instanceof Error) {
    return new AppError(
      'UNKNOWN_ERROR',
      error.message,
      500,
      false,
      {
        originalError: error.name,
        stack: error.stack,
      }
    );
  }

  return new AppError(
    'UNKNOWN_ERROR',
    'An unknown error occurred',
    500,
    false,
    {
      error: String(error),
    }
  );
}
