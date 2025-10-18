import { z, ZodSchema } from 'zod';
import { NextRequest } from 'next/server';
import { apiError } from './response';
import { ErrorCode } from '@/types/error';


export async function validateBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T | null; error: ReturnType<typeof apiError> | null }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data, error: null };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        data: null,
        error: apiError(
          {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Request validation failed',
            details: {
              errors: err.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
                code: issue.code,
              })),
            },
          },
          422
        ),
      };
    }
    return {
      data: null,
      error: apiError(
        {
          code: ErrorCode.BAD_REQUEST,
          message: 'Invalid JSON in request body',
        },
        400
      ),
    };
  }
}


export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): { data: T | null; error: ReturnType<typeof apiError> | null } {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const data = schema.parse(params);
    return { data, error: null };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        data: null,
        error: apiError(
          {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Query parameter validation failed',
            details: {
              errors: err.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
                code: issue.code,
              })),
            },
          },
          422
        ),
      };
    }
    return {
      data: null,
      error: apiError(
        {
          code: ErrorCode.BAD_REQUEST,
          message: 'Invalid query parameters',
        },
        400
      ),
    };
  }
}


export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const idSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
});

export const pubkeySchema = z.object({
  pubkey: z
    .string()
    .min(64, 'Pubkey must be at least 64 characters')
    .max(66, 'Pubkey must be at most 66 characters'),
});
