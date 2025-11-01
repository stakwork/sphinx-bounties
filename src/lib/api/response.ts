import { NextResponse } from "next/server";
import type { ApiResponse, ApiError, ApiMeta, PaginationMeta } from "@/types/api";

/**
 * Create a successful API response
 *
 * Response format:
 * {
 *   success: true,
 *   data: T,
 *   meta: { timestamp, ...customMeta }
 * }
 *
 * @param data - The response data
 * @param meta - Optional metadata (pagination, requestId, etc.)
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with ApiResponse<T> structure
 */
export function apiSuccess<T>(
  data: T,
  meta?: Partial<ApiMeta>,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    },
    { status }
  );
}

/**
 * Create an error API response
 *
 * Response format:
 * {
 *   success: false,
 *   error: { code, message, details?, field? },
 *   meta: { timestamp }
 * }
 *
 * @param error - Error object with code and message
 * @param status - HTTP status code (default: 400)
 * @param meta - Optional metadata
 * @returns NextResponse with error structure
 */
export function apiError(
  error: ApiError,
  status = 400,
  meta?: Partial<ApiMeta>
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      success: false,
      error,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    },
    { status }
  );
}

/**
 * Create a paginated API response
 *
 * Response format:
 * {
 *   success: true,
 *   data: T[],
 *   meta: {
 *     timestamp,
 *     pagination: { page, pageSize, totalPages, totalCount, hasMore }
 *   }
 * }
 *
 * This is the standard format for all paginated endpoints.
 * Client components should access:
 * - Array data: response.data
 * - Pagination info: response.meta.pagination
 *
 * @param data - Array of items to return
 * @param pagination - Pagination metadata (page, pageSize, totalCount)
 * @param meta - Optional additional metadata
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with paginated structure
 */
export function apiPaginated<T>(
  data: T[],
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
  },
  meta?: Partial<ApiMeta>,
  status = 200
): NextResponse<ApiResponse<T[]>> {
  const { page, pageSize, totalCount } = pagination;
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasMore = page < totalPages;

  const paginationMeta: PaginationMeta = {
    page,
    pageSize,
    totalPages,
    totalCount,
    hasMore,
  };

  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
        pagination: paginationMeta,
      },
    },
    { status }
  );
}

/**
 * Create a 201 Created response
 * Wrapper around apiSuccess with status 201
 *
 * @param data - The created resource data
 * @param meta - Optional metadata
 * @returns NextResponse with status 201
 */
export function apiCreated<T>(data: T, meta?: Partial<ApiMeta>): NextResponse<ApiResponse<T>> {
  return apiSuccess(data, meta, 201);
}

export function apiNoContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}
