import { NextResponse } from "next/server";
import type { ApiResponse, ApiError, ApiMeta, PaginationMeta } from "@/types/api";

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

export function apiCreated<T>(data: T, meta?: Partial<ApiMeta>): NextResponse<ApiResponse<T>> {
  return apiSuccess(data, meta, 201);
}

export function apiNoContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}
