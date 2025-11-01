/**
 * Standard API response structure used across all endpoints
 *
 * Success response:
 * {
 *   success: true,
 *   data: T,
 *   meta: { timestamp, pagination?, ... }
 * }
 *
 * Error response:
 * {
 *   success: false,
 *   error: { code, message, details?, field? },
 *   meta: { timestamp }
 * }
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  field?: string;
}

/**
 * Metadata included in all API responses
 * Contains timestamp and optional pagination info
 */
export interface ApiMeta {
  timestamp: string;
  requestId?: string;
  pagination?: PaginationMeta;
}

/**
 * Pagination metadata for paginated responses
 * Located at response.meta.pagination
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
}

export interface PaginationResult {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface FilterParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Type for paginated API responses
 *
 * Ensures type safety for responses with pagination:
 * {
 *   success: true,
 *   data: T[],
 *   meta: {
 *     timestamp: string,
 *     pagination: { page, pageSize, totalPages, totalCount, hasMore }
 *   }
 * }
 *
 * Usage in components:
 * ```typescript
 * const { data: response } = useQuery<PaginatedApiResponse<Workspace>>(...);
 * const items = response?.data || [];
 * const pagination = response?.meta?.pagination;
 * ```
 */
export type PaginatedApiResponse<T> = ApiResponse<T[]> & {
  meta: ApiMeta & {
    pagination: PaginationMeta;
  };
};
