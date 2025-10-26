import type { UserFilters, UserSortParams } from "@/services/user/queries";
import type { PaginationParams } from "@/types";

export const userClient = {
  async getAll(filters?: UserFilters, pagination?: PaginationParams, sort?: UserSortParams) {
    const params = new URLSearchParams();

    if (pagination?.page) params.append("page", pagination.page.toString());
    if (pagination?.pageSize) params.append("pageSize", pagination.pageSize.toString());
    if (sort?.sortBy) params.append("sortBy", sort.sortBy);
    if (sort?.sortOrder) params.append("sortOrder", sort.sortOrder);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.githubVerified !== undefined)
      params.append("githubVerified", filters.githubVerified.toString());
    if (filters?.twitterVerified !== undefined)
      params.append("twitterVerified", filters.twitterVerified.toString());

    const response = await fetch(`/api/users?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch users");
    }

    const result = await response.json();
    return result;
  },

  async getByPubkey(pubkey: string) {
    const response = await fetch(`/api/users/${pubkey}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch user");
    }

    const result = await response.json();
    return result.data;
  },

  async getByUsername(username: string) {
    const response = await fetch(`/api/users?username=${username}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch user");
    }

    const result = await response.json();
    return result.data?.[0] || null;
  },

  async getProfileByPubkey(pubkey: string) {
    return userClient.getByPubkey(pubkey);
  },

  async search(query: string, pagination?: PaginationParams) {
    return userClient.getAll({ search: query }, pagination);
  },

  async getGithubVerified(pagination?: PaginationParams) {
    return userClient.getAll({ githubVerified: true }, pagination);
  },

  async getTwitterVerified(pagination?: PaginationParams) {
    return userClient.getAll({ twitterVerified: true }, pagination);
  },

  async isUsernameAvailable(username: string, excludePubkey?: string) {
    const params = new URLSearchParams({ username });
    if (excludePubkey) params.append("excludePubkey", excludePubkey);

    const response = await fetch(`/api/users/username/available?${params.toString()}`);

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.data?.available || false;
  },
};
