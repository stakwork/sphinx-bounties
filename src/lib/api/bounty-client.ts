import type { BountyFilters, BountySortParams } from "@/types/filters";
import type { PaginationParams } from "@/types";
import { apiFetch } from "@/lib/api/api-fetch";
import { API_ROUTES } from "@/constants/api";

/**
 * Bounty API Client
 *
 * All methods return ApiResponse<T> format:
 * {
 *   success: boolean,
 *   data: T,
 *   meta: {
 *     timestamp: string,
 *     pagination?: { page, pageSize, totalCount, totalPages }
 *   }
 * }
 */
export const bountyClient = {
  /**
   * Get all bounties with optional filtering and pagination
   * @returns ApiResponse with data as Bounty[] and meta.pagination
   */
  async getAll(filters?: BountyFilters, pagination?: PaginationParams, sort?: BountySortParams) {
    const params = new URLSearchParams();

    if (pagination?.page) params.append("page", pagination.page.toString());
    if (pagination?.pageSize) params.append("pageSize", pagination.pageSize.toString());
    if (sort?.sortBy) params.append("sortBy", sort.sortBy);
    if (sort?.sortOrder) params.append("sortOrder", sort.sortOrder);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.workspaceId) params.append("workspaceId", filters.workspaceId);
    if (filters?.assigneePubkey) params.append("assigneePubkey", filters.assigneePubkey);
    if (filters?.creatorPubkey) params.append("creatorPubkey", filters.creatorPubkey);
    if (filters?.search) params.append("search", filters.search);

    const response = await apiFetch(`${API_ROUTES.BOUNTIES.BASE}?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch bounties");
    }

    const result = await response.json();
    return result;
  },

  /**
   * Get bounty by ID
   * @returns Single bounty data (unwrapped from ApiResponse.data)
   */
  async getById(id: string) {
    const response = await apiFetch(API_ROUTES.BOUNTIES.BY_ID(id));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch bounty");
    }

    const result = await response.json();
    return result.data;
  },

  async getByWorkspaceId(
    workspaceId: string,
    pagination?: PaginationParams,
    sort?: BountySortParams
  ) {
    return bountyClient.getAll({ workspaceId }, pagination, sort);
  },

  async getByAssigneePubkey(
    assigneePubkey: string,
    pagination?: PaginationParams,
    sort?: BountySortParams
  ) {
    return bountyClient.getAll({ assigneePubkey }, pagination, sort);
  },

  async getByCreatorPubkey(
    creatorPubkey: string,
    pagination?: PaginationParams,
    sort?: BountySortParams
  ) {
    return bountyClient.getAll({ creatorPubkey }, pagination, sort);
  },

  async getProofsByBountyId(bountyId: string) {
    const response = await apiFetch(`${API_ROUTES.BOUNTIES.BY_ID(bountyId)}/proofs`);

    if (!response.ok) {
      throw new Error("Failed to fetch proofs");
    }

    return response.json();
  },

  async getProofById(proofId: string, bountyId: string) {
    const response = await apiFetch(`${API_ROUTES.BOUNTIES.BY_ID(bountyId)}/proofs/${proofId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch proof");
    }

    return response.json();
  },
};
