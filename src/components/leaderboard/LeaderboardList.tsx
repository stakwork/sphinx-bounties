"use client";

import Link from "next/link";
import { AvatarWithFallback } from "@/components/common";
import { Trophy, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { LeaderboardEntry } from "@/hooks/queries/use-leaderboard-queries";

interface LeaderboardListProps {
  entries: LeaderboardEntry[];
  startRank: number;
}

export function LeaderboardList({ entries, startRank }: LeaderboardListProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, index) => {
        const rank = startRank + index;
        const displayName = entry.alias || entry.username || `${entry.pubkey.slice(0, 8)}...`;

        return (
          <Link key={entry.pubkey} href={`/people/${entry.pubkey}`}>
            <Card className="hover:shadow-md transition-all duration-200 hover:scale-[1.01] cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-12 text-center">
                    <div className="text-2xl font-bold text-neutral-400">#{rank}</div>
                  </div>

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <AvatarWithFallback
                      src={entry.avatarUrl || undefined}
                      alt={displayName}
                      fallbackText={displayName}
                      size="md"
                    />
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-neutral-900 truncate">{displayName}</p>
                      {rank <= 10 && <TrendingUp className="h-4 w-4 text-primary-500" />}
                    </div>
                    {entry.username && entry.alias && (
                      <p className="text-sm text-neutral-500 truncate">@{entry.username}</p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-neutral-500 uppercase font-medium">Bounties</p>
                      <p className="text-lg font-bold text-neutral-900">
                        {entry.bountiesCompleted}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-neutral-500 uppercase font-medium">Earned</p>
                      <div className="flex items-center gap-1">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        <p className="text-lg font-bold text-primary-600">
                          {parseInt(entry.totalEarned).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-xs text-neutral-400">sats</p>
                    </div>
                  </div>

                  {/* Mobile Stats */}
                  <div className="sm:hidden text-right flex-shrink-0">
                    <p className="text-lg font-bold text-primary-600">
                      {parseInt(entry.totalEarned).toLocaleString()}
                    </p>
                    <p className="text-xs text-neutral-400">sats</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
