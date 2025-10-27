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
  DollarSign,
  Activity,
  ArrowUp,
  ArrowDown,
  Download,
  Calendar,
  Target,
  Zap,
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

type TimeRange = "7d" | "30d" | "90d" | "all";

interface MetricData {
  value: number;
  change: number;
  trend: "up" | "down";
}

interface ChartDataPoint {
  date: string;
  users: number;
  bounties: number;
  workspaces: number;
  transactions: number;
  volume: number;
}

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const isLoading = false;

  // Generate mock analytics data
  const analyticsData = useMemo(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365;
    const chartData: ChartDataPoint[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      chartData.push({
        date: date.toISOString().split("T")[0],
        users: Math.floor(Math.random() * 50) + 20,
        bounties: Math.floor(Math.random() * 30) + 10,
        workspaces: Math.floor(Math.random() * 10) + 5,
        transactions: Math.floor(Math.random() * 40) + 15,
        volume: Math.floor(Math.random() * 500000) + 100000,
      });
    }

    return chartData;
  }, [timeRange]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalUsers = analyticsData.reduce((sum, d) => sum + d.users, 0);
    const totalBounties = analyticsData.reduce((sum, d) => sum + d.bounties, 0);
    const totalWorkspaces = analyticsData.reduce((sum, d) => sum + d.workspaces, 0);
    const totalVolume = analyticsData.reduce((sum, d) => sum + d.volume, 0);
    const totalTransactions = analyticsData.reduce((sum, d) => sum + d.transactions, 0);

    // Calculate growth (compare first half to second half)
    const midpoint = Math.floor(analyticsData.length / 2);
    const firstHalf = analyticsData.slice(0, midpoint);
    const secondHalf = analyticsData.slice(midpoint);

    const firstHalfUsers = firstHalf.reduce((sum, d) => sum + d.users, 0);
    const secondHalfUsers = secondHalf.reduce((sum, d) => sum + d.users, 0);
    const userGrowth = ((secondHalfUsers - firstHalfUsers) / firstHalfUsers) * 100;

    const firstHalfBounties = firstHalf.reduce((sum, d) => sum + d.bounties, 0);
    const secondHalfBounties = secondHalf.reduce((sum, d) => sum + d.bounties, 0);
    const bountyGrowth = ((secondHalfBounties - firstHalfBounties) / firstHalfBounties) * 100;

    const firstHalfVolume = firstHalf.reduce((sum, d) => sum + d.volume, 0);
    const secondHalfVolume = secondHalf.reduce((sum, d) => sum + d.volume, 0);
    const volumeGrowth = ((secondHalfVolume - firstHalfVolume) / firstHalfVolume) * 100;

    return {
      totalUsers,
      totalBounties,
      totalWorkspaces,
      totalVolume,
      totalTransactions,
      userGrowth,
      bountyGrowth,
      volumeGrowth,
      avgUsersPerDay: totalUsers / analyticsData.length,
      avgBountiesPerDay: totalBounties / analyticsData.length,
      avgVolumePerDay: totalVolume / analyticsData.length,
    };
  }, [analyticsData]);

  // Top performing data
  const topMetrics = useMemo(() => {
    return {
      mostActiveDay: analyticsData.reduce(
        (max, d) => (d.users > max.users ? d : max),
        analyticsData[0]
      ),
      highestVolumeDay: analyticsData.reduce(
        (max, d) => (d.volume > max.volume ? d : max),
        analyticsData[0]
      ),
      peakBountiesDay: analyticsData.reduce(
        (max, d) => (d.bounties > max.bounties ? d : max),
        analyticsData[0]
      ),
    };
  }, [analyticsData]);

  // Export analytics to CSV
  const exportToCSV = () => {
    const headers = [
      "Date",
      "New Users",
      "New Bounties",
      "New Workspaces",
      "Transactions",
      "Volume (sats)",
    ];
    const rows = analyticsData.map((d) => [
      d.date,
      d.users.toString(),
      d.bounties.toString(),
      d.workspaces.toString(),
      d.transactions.toString(),
      d.volume.toString(),
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
                change={12.5}
                trend="up"
              />
              <MetricCard
                icon={DollarSign}
                title="Total Volume"
                value={Math.floor(metrics.totalVolume / 1000)}
                change={metrics.volumeGrowth}
                trend={metrics.volumeGrowth >= 0 ? "up" : "down"}
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
              {analyticsData.slice(-20).map((data, i) => (
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
              {analyticsData.slice(-20).map((data, i) => (
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

        {/* Transaction Volume Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Volume</CardTitle>
            <CardDescription>Daily transaction volume in sats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-end justify-between gap-1">
              {analyticsData.slice(-20).map((data, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-orange-500 rounded-t hover:bg-orange-600 transition-colors cursor-pointer"
                    style={{ height: `${(data.volume / 600000) * 100}%`, minHeight: "10px" }}
                    title={`${data.date}: ${data.volume.toLocaleString()} sats`}
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
                <span className="font-semibold">{Math.floor(metrics.avgVolumePerDay / 1000)}K</span>
                <span className="text-muted-foreground"> sats avg/day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded" />
                <span className="text-muted-foreground">Volume (sats)</span>
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
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Transactions</span>
                  <span className="text-sm text-muted-foreground">{metrics.totalTransactions}</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full" style={{ width: "78%" }} />
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
              <Zap className="h-5 w-5 text-orange-500" />
              Highest Volume Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">
                {Math.floor(topMetrics.highestVolumeDay.volume / 1000)}K
              </div>
              <div className="text-sm text-muted-foreground">sats transacted</div>
              <Badge variant="secondary" className="mt-2">
                {new Date(topMetrics.highestVolumeDay.date).toLocaleDateString("en-US", {
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

        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
            <CardDescription>Transaction and earnings overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Transactions</span>
                <span className="text-2xl font-bold">{metrics.totalTransactions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Volume (sats)</span>
                <span className="text-2xl font-bold">
                  {Math.floor(metrics.totalVolume / 1000)}K
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Avg. Transaction Size</span>
                <span className="text-2xl font-bold">
                  {Math.floor(metrics.totalVolume / metrics.totalTransactions).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Daily Avg. Volume</span>
                <span className="text-2xl font-bold">
                  {Math.floor(metrics.avgVolumePerDay / 1000)}K
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
