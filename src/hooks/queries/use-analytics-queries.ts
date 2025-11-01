import { useQuery } from "@tanstack/react-query";
import { analyticsClient } from "@/lib/api/analytics-client";
import { apiFetch } from "@/lib/api/api-fetch";
import { API_ROUTES } from "@/constants/api";

type TimeRange = "7d" | "30d" | "90d" | "all";

interface DailyData {
  date: string;
  users: number;
  bounties: number;
  workspaces: number;
}

interface AdminAnalyticsResponse {
  summary: {
    totalUsers: number;
    totalWorkspaces: number;
    totalBounties: number;
    openBounties: number;
  };
  chartData: DailyData[];
  timeRange: TimeRange;
}

export const analyticsKeys = {
  all: ["analytics"] as const,
  userStats: (pubkey: string) => [...analyticsKeys.all, "user", pubkey] as const,
  workspaceStats: (workspaceId: string) =>
    [...analyticsKeys.all, "workspace", workspaceId] as const,
  adminAnalytics: (timeRange: TimeRange) => [...analyticsKeys.all, "admin", timeRange] as const,
};

export function useGetUserStats(pubkey: string | null | undefined) {
  return useQuery({
    queryKey: analyticsKeys.userStats(pubkey || ""),
    queryFn: () => analyticsClient.getUserStats(pubkey!),
    enabled: !!pubkey,
  });
}

export function useGetWorkspaceStats(workspaceId: string | null | undefined) {
  return useQuery({
    queryKey: analyticsKeys.workspaceStats(workspaceId || ""),
    queryFn: () => analyticsClient.getWorkspaceStats(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useGetAdminAnalytics(timeRange: TimeRange = "30d") {
  return useQuery({
    queryKey: analyticsKeys.adminAnalytics(timeRange),
    queryFn: async (): Promise<AdminAnalyticsResponse> => {
      const response = await apiFetch(`${API_ROUTES.ADMIN.ANALYTICS}?timeRange=${timeRange}`);

      if (!response.ok) {
        throw new Error("Failed to fetch admin analytics");
      }

      const result = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
