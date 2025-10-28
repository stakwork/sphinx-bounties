import type { WorkspaceFilters, WorkspaceSortParams } from "@/types/filters";
import type { PaginationParams } from "@/types";
import { apiFetch } from "@/lib/api/api-fetch";

export const workspaceClient = {
  async getAll(
    filters?: WorkspaceFilters,
    pagination?: PaginationParams,
    sort?: WorkspaceSortParams
  ) {
    const params = new URLSearchParams();

    if (pagination?.page) params.append("page", pagination.page.toString());
    if (pagination?.pageSize) params.append("pageSize", pagination.pageSize.toString());
    if (sort?.sortBy) params.append("sortBy", sort.sortBy);
    if (sort?.sortOrder) params.append("sortOrder", sort.sortOrder);
    if (filters?.ownerPubkey) params.append("owned", "true");
    if (filters?.search) params.append("search", filters.search);

    const response = await apiFetch(`/api/workspaces?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch workspaces");
    }

    const result = await response.json();
    return result;
  },

  async getById(id: string) {
    const response = await apiFetch(`/api/workspaces/${id}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch workspace");
    }

    const result = await response.json();
    return result.data;
  },

  async getByOwnerPubkey(
    ownerPubkey: string,
    pagination?: PaginationParams,
    sort?: WorkspaceSortParams
  ) {
    return workspaceClient.getAll({ ownerPubkey }, pagination, sort);
  },

  async getByMemberPubkey(
    _memberPubkey: string,
    pagination?: PaginationParams,
    sort?: WorkspaceSortParams
  ) {
    return workspaceClient.getAll({}, pagination, sort);
  },

  async getMembersByWorkspaceId(workspaceId: string) {
    const response = await apiFetch(`/api/workspaces/${workspaceId}/members`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch workspace members");
    }

    const result = await response.json();
    return result.data;
  },

  async getUserRole(workspaceId: string, userPubkey: string) {
    const response = await apiFetch(`/api/workspaces/${workspaceId}/members`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch user role");
    }

    const result = await response.json();
    const member = result.data?.find((m: { userPubkey: string }) => m.userPubkey === userPubkey);
    return member?.role || null;
  },

  async getBudget(workspaceId: string) {
    const response = await apiFetch(`/api/workspaces/${workspaceId}/budget`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch workspace budget");
    }

    const result = await response.json();
    return result.data;
  },

  async getTransactions(workspaceId: string, pagination?: PaginationParams, type?: string) {
    const params = new URLSearchParams();

    if (pagination?.page) params.append("page", pagination.page.toString());
    if (pagination?.pageSize) params.append("perPage", pagination.pageSize.toString());
    if (type) params.append("type", type);

    const response = await apiFetch(
      `/api/workspaces/${workspaceId}/transactions?${params.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch workspace transactions");
    }

    const result = await response.json();
    return result.data;
  },

  async getActivities(workspaceId: string, pagination?: PaginationParams, action?: string) {
    const params = new URLSearchParams();

    if (pagination?.page) params.append("page", pagination.page.toString());
    if (pagination?.pageSize) params.append("perPage", pagination.pageSize.toString());
    if (action) params.append("action", action);

    const response = await apiFetch(
      `/api/workspaces/${workspaceId}/activities?${params.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch workspace activities");
    }

    const result = await response.json();
    return result.data;
  },
};
