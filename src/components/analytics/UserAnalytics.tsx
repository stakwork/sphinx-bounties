"use client";

import { useGetUserStats } from "@/hooks/queries/use-analytics-queries";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "./StatsCard";
import { TopSkillsChart } from "./TopSkillsChart";
import { TrendingUp, Target, Award, Briefcase, Clock, Percent } from "lucide-react";

interface UserAnalyticsProps {
  pubkey: string;
}

export function UserAnalytics({ pubkey }: UserAnalyticsProps) {
  const { data: stats, isLoading } = useGetUserStats(pubkey);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="text-center">
            <p className="text-sm text-neutral-600">Unable to load user analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Earned"
          value={`${parseInt(stats.totalEarned).toLocaleString()} sats`}
          description="From completed bounties"
          icon={TrendingUp}
        />
        <StatsCard
          title="Bounties Completed"
          value={stats.bountiesCompleted}
          description={`${stats.activeBounties} currently active`}
          icon={Award}
        />
        <StatsCard
          title="Success Rate"
          value={`${stats.successRate.toFixed(1)}%`}
          description="Of assigned bounties"
          icon={Percent}
        />
        <StatsCard
          title="Workspaces"
          value={stats.workspacesCount}
          description="Member of"
          icon={Briefcase}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Created Bounties"
          value={stats.bountiesCreated}
          description="Total bounties posted"
          icon={Target}
        />
        <StatsCard
          title="Assigned Bounties"
          value={stats.bountiesAssigned}
          description="Total bounties worked on"
        />
        {stats.averageCompletionTime !== null && (
          <StatsCard
            title="Avg. Completion Time"
            value={`${stats.averageCompletionTime.toFixed(1)} days`}
            description="Average time to complete"
            icon={Clock}
          />
        )}
      </div>

      {stats.topSkills.length > 0 && <TopSkillsChart data={stats.topSkills} />}
    </div>
  );
}
