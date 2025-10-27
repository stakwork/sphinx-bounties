"use client";

import Link from "next/link";
import { AvatarWithFallback } from "@/components/common";
import { Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/hooks/queries/use-leaderboard-queries";

interface LeaderboardPodiumProps {
  topThree: LeaderboardEntry[];
}

export function LeaderboardPodium({ topThree }: LeaderboardPodiumProps) {
  // Reorder to show: 2nd, 1st, 3rd (podium style)
  const [first, second, third] = topThree;
  const podiumOrder = second ? [second, first, third].filter(Boolean) : [first];

  const podiumHeights = {
    0: "h-48", // 2nd place (left)
    1: "h-56", // 1st place (center)
    2: "h-40", // 3rd place (right)
  };

  const podiumColors = {
    0: "from-gray-200 to-gray-300 border-gray-400", // Silver
    1: "from-amber-200 to-amber-400 border-amber-500", // Gold
    2: "from-orange-200 to-orange-300 border-orange-400", // Bronze
  };

  const medalIcons = {
    0: <Medal className="h-8 w-8 text-gray-600" />, // 2nd
    1: <Trophy className="h-10 w-10 text-amber-600" />, // 1st
    2: <Award className="h-7 w-7 text-orange-600" />, // 3rd
  };

  const ranks = {
    0: 2, // 2nd place
    1: 1, // 1st place
    2: 3, // 3rd place
  };

  if (!first) return null;

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      <div className="flex items-end justify-center gap-4 px-4">
        {podiumOrder.map((entry, displayIndex) => {
          if (!entry) return null;

          const actualRank = ranks[displayIndex as keyof typeof ranks];
          const displayName = entry.alias || entry.username || `${entry.pubkey.slice(0, 8)}...`;

          return (
            <Link
              key={entry.pubkey}
              href={`/people/${entry.pubkey}`}
              className="flex-1 max-w-xs group"
            >
              <div className="flex flex-col items-center space-y-3 cursor-pointer">
                {/* User Avatar & Rank */}
                <div className="relative">
                  {/* Medal/Trophy Icon */}
                  <div className="absolute -top-3 -right-3 z-10 bg-white rounded-full p-1 shadow-lg">
                    {medalIcons[displayIndex as keyof typeof medalIcons]}
                  </div>

                  {/* Avatar */}
                  <div
                    className={cn(
                      "relative ring-4 rounded-full transition-transform group-hover:scale-110",
                      displayIndex === 1 ? "ring-amber-400" : "",
                      displayIndex === 0 ? "ring-gray-400" : "",
                      displayIndex === 2 ? "ring-orange-400" : ""
                    )}
                  >
                    <AvatarWithFallback
                      src={entry.avatarUrl || undefined}
                      alt={displayName}
                      fallbackText={displayName}
                      size={displayIndex === 1 ? "xl" : "lg"}
                    />
                  </div>

                  {/* Rank Badge */}
                  <div
                    className={cn(
                      "absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold text-white shadow-md",
                      displayIndex === 1 ? "bg-amber-500" : "",
                      displayIndex === 0 ? "bg-gray-500" : "",
                      displayIndex === 2 ? "bg-orange-500" : ""
                    )}
                  >
                    #{actualRank}
                  </div>
                </div>

                {/* User Info */}
                <div className="text-center space-y-1 px-2">
                  <p
                    className={cn(
                      "font-bold truncate max-w-full",
                      displayIndex === 1 ? "text-lg" : "text-base"
                    )}
                  >
                    {displayName}
                  </p>
                  {entry.username && entry.alias && (
                    <p className="text-xs text-neutral-500 truncate">@{entry.username}</p>
                  )}
                </div>

                {/* Podium */}
                <div
                  className={cn(
                    "w-full rounded-t-xl border-2 transition-all group-hover:shadow-xl",
                    "bg-gradient-to-b flex flex-col items-center justify-start pt-6 px-4",
                    podiumHeights[displayIndex as keyof typeof podiumHeights],
                    podiumColors[displayIndex as keyof typeof podiumColors]
                  )}
                >
                  {/* Stats */}
                  <div className="space-y-2 text-center">
                    <div>
                      <p className="text-2xl font-black text-neutral-900">
                        {parseInt(entry.totalEarned).toLocaleString()}
                      </p>
                      <p className="text-xs font-semibold text-neutral-700">sats earned</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-neutral-800">
                        {entry.bountiesCompleted}
                      </p>
                      <p className="text-xs font-medium text-neutral-600">bounties</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Podium Base */}
      <div className="h-4 bg-gradient-to-b from-neutral-200 to-neutral-300 border-t-2 border-neutral-400 rounded-t-lg mt-0" />
    </div>
  );
}
