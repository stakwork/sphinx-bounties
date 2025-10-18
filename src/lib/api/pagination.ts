import type { PaginationParams, PaginationMeta } from "@/types/api";

export function getPaginationValues(params: PaginationParams) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  return { skip, take, page, pageSize };
}

export function getPaginationMeta(
  page: number,
  pageSize: number,
  totalCount: number
): PaginationMeta {
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasMore = page < totalPages;

  return {
    page,
    pageSize,
    totalPages,
    totalCount,
    hasMore,
  };
}
