import { useQuery } from "@tanstack/react-query";
import type { PaginationParams, PaginationMeta } from "@/types/api";

export interface LeaderboardEntry {
  pubkey: string;
  username: string;
  alias: string | null;
  avatarUrl: string | null;
  totalEarned: string;
  bountiesCompleted: number;
  lastCompletedAt: string | null;
}

export interface LeaderboardResponse {
  success: boolean;
  data: LeaderboardEntry[];
  pagination?: PaginationMeta;
}

export function useGetLeaderboard(params?: PaginationParams) {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set("page", params.page.toString());
  if (params?.pageSize) queryParams.set("limit", params.pageSize.toString());

  return useQuery<LeaderboardResponse>({
    queryKey: ["leaderboard", params?.page, params?.pageSize],
    queryFn: async () => {
      const response = await fetch(`/api/leaderboard?${queryParams.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard");
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
