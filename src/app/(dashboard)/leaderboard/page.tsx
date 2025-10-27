"use client";

import { useState } from "react";
import { useGetLeaderboard } from "@/hooks/queries/use-leaderboard-queries";
import { LeaderboardPodium, LeaderboardList } from "@/components/leaderboard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Award, TrendingUp, ChevronDown } from "lucide-react";

export default function LeaderboardPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, error } = useGetLeaderboard({ page, pageSize });

  const leaderboard = data?.data || [];
  const pagination = data?.pagination;

  // Split top 3 from the rest
  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const showLoadMore = pagination && page < pagination.totalPages;

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <Trophy className="h-10 w-10 text-amber-500" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            Leaderboard
          </h1>
          <Trophy className="h-10 w-10 text-amber-500" />
        </div>
        <p className="text-lg text-neutral-600">
          Top contributors ranked by total earnings and bounties completed
        </p>
      </div>

      {/* Stats Overview */}
      {!isLoading && pagination && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <Award className="h-8 w-8 text-primary-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-neutral-900">{pagination.totalCount}</p>
              <p className="text-sm text-neutral-600">Total Contributors</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Trophy className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-neutral-900">
                {topThree[0] ? parseInt(topThree[0].totalEarned).toLocaleString() : "0"}
              </p>
              <p className="text-sm text-neutral-600">Top Earner</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-neutral-900">
                {topThree[0]?.bountiesCompleted || 0}
              </p>
              <p className="text-sm text-neutral-600">Bounties Completed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-8">
          <div className="flex items-end justify-center gap-4 px-4">
            <Skeleton className="h-48 w-48" />
            <Skeleton className="h-56 w-48" />
            <Skeleton className="h-40 w-48" />
          </div>
          <div className="space-y-2 max-w-4xl mx-auto">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load leaderboard</h3>
            <p className="text-neutral-600">Please try again later</p>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Content */}
      {!isLoading && !error && (
        <>
          {/* Top 3 Podium */}
          {topThree.length > 0 && (
            <div className="mb-12">
              <LeaderboardPodium topThree={topThree} />
            </div>
          )}

          {/* Rest of the list */}
          {rest.length > 0 && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center gap-2 px-2">
                <div className="flex-1 h-px bg-neutral-200" />
                <h2 className="text-lg font-semibold text-neutral-600">Top Contributors</h2>
                <div className="flex-1 h-px bg-neutral-200" />
              </div>

              <LeaderboardList entries={rest} startRank={4} />

              {/* Load More */}
              {showLoadMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    className="gap-2"
                    disabled={isLoading}
                  >
                    Load More
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {leaderboard.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No contributors yet</h3>
                <p className="text-neutral-600">
                  Be the first to complete a bounty and claim your spot!
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
