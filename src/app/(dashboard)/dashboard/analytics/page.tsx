"use client";

import { useState, useEffect, useMemo } from "react";
import { useGetWorkspaceStats } from "@/hooks/queries/use-analytics-queries";
import { useGetWorkspaces } from "@/hooks/queries/use-workspace-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatsCard } from "@/components/analytics/StatsCard";
import { BountyDistributionChart } from "@/components/analytics/BountyDistributionChart";
import { BudgetChart } from "@/components/analytics/BudgetChart";
import { TrendingUp, Users, Target, Activity, Clock, Percent } from "lucide-react";
import type { WorkspaceListItem } from "@/types";

export default function DashboardAnalyticsPage() {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);

  // Fetch user's workspaces to populate the dropdown
  const { data: workspacesResponse, isLoading: isLoadingWorkspaces } = useGetWorkspaces();
  const workspaces = useMemo(() => workspacesResponse?.data || [], [workspacesResponse?.data]);

  // Auto-select first workspace when workspaces load
  useEffect(() => {
    if (!selectedWorkspaceId && workspaces.length > 0) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, selectedWorkspaceId]);

  const { data: workspaceStats, isLoading: isLoadingStats } =
    useGetWorkspaceStats(selectedWorkspaceId);
  const isLoading = isLoadingWorkspaces || isLoadingStats;

  if (isLoading) {
    return (
      <div className="container max-w-7xl py-8 space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-[400px]" />
          ))}
        </div>
      </div>
    );
  }

  if (!isLoading && workspaces.length === 0) {
    return (
      <div className="container max-w-7xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Workspace Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16">
              <TrendingUp className="h-16 w-16 text-neutral-300 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Workspaces Found</h3>
              <p className="text-sm text-neutral-600 mb-6">
                Create a workspace to view analytics and insights
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!workspaceStats) {
    return (
      <div className="container max-w-7xl py-8">
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <p className="text-sm text-neutral-600">Unable to load workspace analytics</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = workspaceStats.stats;

  return (
    <div className="container max-w-7xl py-8 space-y-8">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border border-purple-200/50 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-transparent" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
              {workspaceStats.workspace.name}
            </h1>
            <p className="text-sm text-neutral-600 mt-2 font-medium">Analytics Dashboard</p>
          </div>
          <Select value={selectedWorkspaceId || ""} onValueChange={setSelectedWorkspaceId}>
            <SelectTrigger className="w-[280px] bg-white/80 backdrop-blur-sm border-purple-200/50 hover:border-purple-300 transition-all duration-200">
              <SelectValue placeholder="Select workspace" />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map((workspace: WorkspaceListItem) => (
                <SelectItem key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Bounties"
          value={stats.bounties.total}
          description="All bounties created"
          icon={Target}
        />
        <StatsCard
          title="Completion Rate"
          value={`${stats.metrics.completionRate.toFixed(1)}%`}
          description="Bounties completed"
          icon={Percent}
        />
        <StatsCard
          title="Total Members"
          value={stats.members.total}
          description="Active workspace members"
          icon={Users}
        />
        <StatsCard
          title="Activities"
          value={stats.activities.total}
          description="Total workspace activities"
          icon={Activity}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Available Budget"
          value={`${parseInt(stats.budget.available).toLocaleString()} sats`}
          description="Available for new bounties"
          icon={TrendingUp}
        />
        <StatsCard
          title="Reserved Budget"
          value={`${parseInt(stats.budget.reserved).toLocaleString()} sats`}
          description="Locked in active bounties"
        />
        <StatsCard
          title="Paid Out"
          value={`${parseInt(stats.budget.paid).toLocaleString()} sats`}
          description="Total paid to contributors"
        />
      </div>

      {stats.metrics.averageCompletionTime !== null && (
        <StatsCard
          title="Average Completion Time"
          value={`${stats.metrics.averageCompletionTime.toFixed(1)} days`}
          description="Average time to complete bounties"
          icon={Clock}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <BountyDistributionChart
          data={{
            open: stats.bounties.open,
            assigned: stats.bounties.assigned,
            completed: stats.bounties.completed,
          }}
        />
        <BudgetChart data={stats.budget} />
      </div>
    </div>
  );
}
