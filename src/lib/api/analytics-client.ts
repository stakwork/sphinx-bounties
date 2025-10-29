import { apiFetch } from "@/lib/api/api-fetch";
import { API_ROUTES } from "@/constants/api";
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
  async getUserStats(pubkey: string): Promise<UserStats> {
    const response = await apiFetch(API_ROUTES.USERS.STATS(pubkey));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch user stats");
    }

    const result = await response.json();
    return result.stats;
  },

  async getWorkspaceStats(workspaceId: string): Promise<WorkspaceStats> {
    const response = await apiFetch(`${API_ROUTES.ADMIN.WORKSPACES}/${workspaceId}/stats`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch workspace stats");
    }

    const result = await response.json();
    return result;
  },
};
