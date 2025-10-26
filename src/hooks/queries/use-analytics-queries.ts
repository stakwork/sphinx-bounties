import { useQuery } from "@tanstack/react-query";
import { analyticsClient } from "@/lib/api/analytics-client";

export const analyticsKeys = {
  all: ["analytics"] as const,
  userStats: (pubkey: string) => [...analyticsKeys.all, "user", pubkey] as const,
  workspaceStats: (workspaceId: string) =>
    [...analyticsKeys.all, "workspace", workspaceId] as const,
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
