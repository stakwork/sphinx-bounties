import { apiFetch } from "@/lib/api/api-fetch";
import { API_ROUTES } from "@/constants/api";

/**
 * Analytics API Client
 *
 * All methods return data unwrapped from ApiResponse<T>.data
 * The API returns: { success: true, data: T, meta: { timestamp } }
 * These methods extract and return just the data property.
 */

export interface UserStats {
  totalEarned: string;
  bountiesCompleted: number;
  bountiesCreated: number;
  bountiesAssigned: number;
  activeBounties: number;
  workspacesCount: number;
  successRate: number;
  averageCompletionTime: number | null;
  topSkills: Array<{ language: string; count: number }>;
}

export interface WorkspaceStats {
  workspace: {
    id: string;
    name: string;
  };
  stats: {
    bounties: {
      total: number;
      open: number;
      assigned: number;
      completed: number;
    };
    budget: {
      total: string;
      available: string;
      reserved: string;
      paid: string;
      allocated: string;
    };
    members: {
      total: number;
    };
    activities: {
      total: number;
    };
    metrics: {
      averageCompletionTime: number | null;
      completionRate: number;
    };
  };
}

export const analyticsClient = {
  /**
   * Get user statistics
   * @returns UserStats data (unwrapped from ApiResponse.data)
   */
  async getUserStats(pubkey: string): Promise<UserStats> {
    const response = await apiFetch(API_ROUTES.USERS.STATS(pubkey));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch user stats");
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Get workspace statistics
   * @returns WorkspaceStats data (unwrapped from ApiResponse.data)
   */
  async getWorkspaceStats(workspaceId: string): Promise<WorkspaceStats> {
    const response = await apiFetch(`${API_ROUTES.ADMIN.WORKSPACES}/${workspaceId}/stats`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch workspace stats");
    }

    const result = await response.json();
    return result.data;
  },
};
