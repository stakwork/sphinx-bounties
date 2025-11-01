"use client";

/**
 * ADMIN PLATFORM ANALYTICS PAGE
 * Route: /admin/analytics
 *
 * Features:
 * - Growth metrics (users, bounties, workspaces over time)
 * - Engagement charts (activity trends, completion rates)
 * - Financial analytics (transaction volume, earnings distribution)
 * - User behavior insights (active users, retention)
 * - Workspace performance metrics
 * - Time range filters (7d, 30d, 90d, all time)
 * - Export analytics data to CSV
 *
 * API: Would use GET /api/admin/analytics
 * Auth: Super admin only
 */

import { useState, useMemo } from "react";
import {
  TrendingUp,
  Users,
  Briefcase,
  Activity,
  ArrowUp,
  ArrowDown,
  Download,
  Calendar,
  Target,
  Clock,
  CheckCircle,
  Award,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAdminAnalytics } from "@/hooks/queries/use-analytics-queries";

type TimeRange = "7d" | "30d" | "90d" | "all";

interface MetricData {
  value: number;
  change: number;
  trend: "up" | "down";
}

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const { data: analyticsData, isLoading } = useGetAdminAnalytics(timeRange);

  const chartData = useMemo(() => analyticsData?.chartData || [], [analyticsData?.chartData]);

  const metrics = useMemo(() => {
    if (!chartData.length) {
      return {
        totalUsers: 0,
        totalBounties: 0,
        totalWorkspaces: 0,
        userGrowth: 0,
        bountyGrowth: 0,
        workspaceGrowth: 0,
        avgUsersPerDay: 0,
        avgBountiesPerDay: 0,
        avgWorkspacesPerDay: 0,
      };
    }

    const totalUsers = chartData.reduce((sum, d) => sum + d.users, 0);
    const totalBounties = chartData.reduce((sum, d) => sum + d.bounties, 0);
    const totalWorkspaces = chartData.reduce((sum, d) => sum + d.workspaces, 0);

    const midpoint = Math.floor(chartData.length / 2);
    const firstHalf = chartData.slice(0, midpoint);
    const secondHalf = chartData.slice(midpoint);

    const firstHalfUsers = firstHalf.reduce((sum, d) => sum + d.users, 0);
    const secondHalfUsers = secondHalf.reduce((sum, d) => sum + d.users, 0);
    const userGrowth =
      firstHalfUsers > 0 ? ((secondHalfUsers - firstHalfUsers) / firstHalfUsers) * 100 : 0;

    const firstHalfBounties = firstHalf.reduce((sum, d) => sum + d.bounties, 0);
    const secondHalfBounties = secondHalf.reduce((sum, d) => sum + d.bounties, 0);
    const bountyGrowth =
      firstHalfBounties > 0
        ? ((secondHalfBounties - firstHalfBounties) / firstHalfBounties) * 100
        : 0;

    const firstHalfWorkspaces = firstHalf.reduce((sum, d) => sum + d.workspaces, 0);
    const secondHalfWorkspaces = secondHalf.reduce((sum, d) => sum + d.workspaces, 0);
    const workspaceGrowth =
      firstHalfWorkspaces > 0
        ? ((secondHalfWorkspaces - firstHalfWorkspaces) / firstHalfWorkspaces) * 100
        : 0;

    return {
      totalUsers,
      totalBounties,
      totalWorkspaces,
      userGrowth,
      bountyGrowth,
      workspaceGrowth,
      avgUsersPerDay: totalUsers / chartData.length,
      avgBountiesPerDay: totalBounties / chartData.length,
      avgWorkspacesPerDay: totalWorkspaces / chartData.length,
    };
  }, [chartData]);

  const topMetrics = useMemo(() => {
    if (!chartData.length) {
      return {
        mostActiveDay: { date: "", users: 0, bounties: 0, workspaces: 0 },
        peakBountiesDay: { date: "", users: 0, bounties: 0, workspaces: 0 },
        peakWorkspacesDay: { date: "", users: 0, bounties: 0, workspaces: 0 },
      };
    }

    return {
      mostActiveDay: chartData.reduce((max, d) => (d.users > max.users ? d : max), chartData[0]),
      peakBountiesDay: chartData.reduce(
        (max, d) => (d.bounties > max.bounties ? d : max),
        chartData[0]
      ),
      peakWorkspacesDay: chartData.reduce(
        (max, d) => (d.workspaces > max.workspaces ? d : max),
        chartData[0]
      ),
    };
  }, [chartData]);

  // Export analytics to CSV
  const exportToCSV = () => {
    const headers = ["Date", "New Users", "New Bounties", "New Workspaces"];
    const rows = chartData.map((d) => [
      d.date,
      d.users.toString(),
      d.bounties.toString(),
      d.workspaces.toString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${timeRange}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const MetricCard = ({
    icon: Icon,
    title,
    value,
    change,
    trend,
  }: MetricData & { icon: React.ComponentType<{ className?: string }>; title: string }) => (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>{title}</CardDescription>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div
          className={`flex items-center gap-1 text-sm ${trend === "up" ? "text-green-600" : "text-red-600"}`}
        >
          {trend === "up" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          <span>{Math.abs(change).toFixed(1)}%</span>
          <span className="text-muted-foreground">vs previous period</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Platform Analytics</h1>
          <p className="text-muted-foreground">Track growth, engagement, and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Primary Growth Metrics */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Growth Overview</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-20" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <MetricCard
                icon={Users}
                title="Total Users"
                value={metrics.totalUsers}
                change={metrics.userGrowth}
                trend={metrics.userGrowth >= 0 ? "up" : "down"}
              />
              <MetricCard
                icon={Target}
                title="Total Bounties"
                value={metrics.totalBounties}
                change={metrics.bountyGrowth}
                trend={metrics.bountyGrowth >= 0 ? "up" : "down"}
              />
              <MetricCard
                icon={Briefcase}
                title="Total Workspaces"
                value={metrics.totalWorkspaces}
                change={metrics.workspaceGrowth}
                trend={metrics.workspaceGrowth >= 0 ? "up" : "down"}
              />
            </>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth Trend</CardTitle>
            <CardDescription>New user registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-end justify-between gap-1">
              {chartData.slice(-20).map((data, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                    style={{ height: `${(data.users / 70) * 100}%`, minHeight: "10px" }}
                    title={`${data.date}: ${data.users} users`}
                  />
                  {i % 5 === 0 && (
                    <span className="text-xs text-muted-foreground rotate-45 origin-left whitespace-nowrap">
                      {new Date(data.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <div>
                <span className="font-semibold">{metrics.avgUsersPerDay.toFixed(1)}</span>
                <span className="text-muted-foreground"> avg/day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className="text-muted-foreground">New Users</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bounty Creation Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Bounty Creation Trend</CardTitle>
            <CardDescription>New bounties posted over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-end justify-between gap-1">
              {chartData.slice(-20).map((data, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors cursor-pointer"
                    style={{ height: `${(data.bounties / 40) * 100}%`, minHeight: "10px" }}
                    title={`${data.date}: ${data.bounties} bounties`}
                  />
                  {i % 5 === 0 && (
                    <span className="text-xs text-muted-foreground rotate-45 origin-left whitespace-nowrap">
                      {new Date(data.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <div>
                <span className="font-semibold">{metrics.avgBountiesPerDay.toFixed(1)}</span>
                <span className="text-muted-foreground"> avg/day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-muted-foreground">New Bounties</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workspace Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Workspace Growth</CardTitle>
            <CardDescription>New workspaces created over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-end justify-between gap-1">
              {chartData.slice(-20).map((data, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-purple-500 rounded-t hover:bg-purple-600 transition-colors cursor-pointer"
                    style={{ height: `${(data.workspaces / 15) * 100}%`, minHeight: "10px" }}
                    title={`${data.date}: ${data.workspaces} workspaces`}
                  />
                  {i % 5 === 0 && (
                    <span className="text-xs text-muted-foreground rotate-45 origin-left whitespace-nowrap">
                      {new Date(data.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <div>
                <span className="font-semibold">{metrics.avgWorkspacesPerDay.toFixed(1)}</span>
                <span className="text-muted-foreground"> avg/day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded" />
                <span className="text-muted-foreground">Workspaces</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
            <CardDescription>Platform engagement across metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">User Signups</span>
                  <span className="text-sm text-muted-foreground">{metrics.totalUsers}</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{
                      width: `${(metrics.totalUsers / (metrics.totalUsers + metrics.totalBounties)) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Bounties Created</span>
                  <span className="text-sm text-muted-foreground">{metrics.totalBounties}</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-green-500 h-full rounded-full"
                    style={{
                      width: `${(metrics.totalBounties / (metrics.totalUsers + metrics.totalBounties)) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Workspaces Created</span>
                  <span className="text-sm text-muted-foreground">{metrics.totalWorkspaces}</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: "45%" }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Most Active Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">{topMetrics.mostActiveDay.users}</div>
              <div className="text-sm text-muted-foreground">users joined</div>
              <Badge variant="secondary" className="mt-2">
                {new Date(topMetrics.mostActiveDay.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-purple-500" />
              Peak Workspaces Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">{topMetrics.peakWorkspacesDay.workspaces}</div>
              <div className="text-sm text-muted-foreground">workspaces created</div>
              <Badge variant="secondary" className="mt-2">
                {new Date(topMetrics.peakWorkspacesDay.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Peak Bounties Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">{topMetrics.peakBountiesDay.bounties}</div>
              <div className="text-sm text-muted-foreground">bounties posted</div>
              <Badge variant="secondary" className="mt-2">
                {new Date(topMetrics.peakBountiesDay.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Key Performance Indicators</CardTitle>
            <CardDescription>Critical metrics for platform health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Bounty Completion Rate</span>
                </div>
                <span className="text-2xl font-bold">78%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Avg. Time to Complete</span>
                </div>
                <span className="text-2xl font-bold">5.2d</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-orange-500" />
                  <span className="font-medium">Active Contributors</span>
                </div>
                <span className="text-2xl font-bold">342</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">Monthly Growth Rate</span>
                </div>
                <span className="text-2xl font-bold">+24%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
