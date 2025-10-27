"use client";

/**
 * ADMIN DASHBOARD PAGE
 * Route: /admin
 *
 * Child pages to implement:
 * - bounties/page.tsx             All bounties management
 * - workspaces/page.tsx           All workspaces management
 * - users/page.tsx                User management
 * - transactions/page.tsx         Financial monitoring
 * - analytics/page.tsx            Platform analytics
 * - settings/page.tsx             Platform settings
 *
 * Components: AdminStats, AdminTable, AdminSidebar (@sidebar parallel route)
 * API: All endpoints with elevated permissions
 * Auth: Super admin only
 */

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  TrendingUp,
  Users,
  Wallet,
  FileText,
  Building2,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGetBounties } from "@/hooks/queries/use-bounty-queries";
import { cn } from "@/lib/utils";
import type { BountyListItem } from "@/types/bounty";

export default function AdminPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  // Fetch all bounties to calculate platform stats
  const { data: bountiesData, isLoading: bountiesLoading, error: bountiesError } = useGetBounties();

  // Calculate platform statistics
  const stats = {
    totalBounties: bountiesData?.bounties?.length || 0,
    openBounties:
      bountiesData?.bounties?.filter((b: BountyListItem) => b.status === "OPEN")?.length || 0,
    assignedBounties:
      bountiesData?.bounties?.filter((b: BountyListItem) => b.status === "ASSIGNED")?.length || 0,
    completedBounties:
      bountiesData?.bounties?.filter(
        (b: BountyListItem) => b.status === "COMPLETED" || b.status === "PAID"
      )?.length || 0,
    totalValue:
      bountiesData?.bounties?.reduce(
        (sum: number, b: BountyListItem) => sum + (b.amount || 0),
        0
      ) || 0,
    paidOut:
      bountiesData?.bounties
        ?.filter((b: BountyListItem) => b.status === "PAID")
        ?.reduce((sum: number, b: BountyListItem) => sum + (b.amount || 0), 0) || 0,
    // Mock data for demo - in real app these would come from platform-wide endpoints
    totalUsers: 247,
    totalWorkspaces: 42,
    activeUsers: 89,
    newUsersThisWeek: 12,
  };

  // Calculate growth rates (mock data - would be calculated from historical data)
  const growthRates = {
    bounties: 12.5,
    users: 8.3,
    workspaces: 15.2,
    revenue: 23.7,
  };

  // Recent activity (mock data - would come from activity log)
  const recentActivity = [
    { type: "bounty", action: "New bounty created", user: "Alice", time: "2 min ago" },
    { type: "user", action: "New user registered", user: "Bob", time: "15 min ago" },
    { type: "workspace", action: "Workspace verified", user: "Charlie", time: "1 hour ago" },
    { type: "payment", action: "Payment processed", user: "Dave", time: "2 hours ago" },
    { type: "bounty", action: "Bounty completed", user: "Eve", time: "3 hours ago" },
  ];

  if (bountiesError) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load admin dashboard. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform management and analytics</p>
      </div>

      {/* Time Range Filter */}
      <div className="flex gap-2 mb-6">
        {(["7d", "30d", "90d", "all"] as const).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(range)}
          >
            {range === "7d" && "Last 7 Days"}
            {range === "30d" && "Last 30 Days"}
            {range === "90d" && "Last 90 Days"}
            {range === "all" && "All Time"}
          </Button>
        ))}
      </div>

      {/* Primary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Total Bounties */}
        {bountiesLoading ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bounties</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBounties}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <TrendingUp
                  className={cn(
                    "mr-1 h-3 w-3",
                    growthRates.bounties >= 0 ? "text-green-500" : "text-red-500"
                  )}
                />
                <span className={growthRates.bounties >= 0 ? "text-green-500" : "text-red-500"}>
                  {growthRates.bounties >= 0 ? "+" : ""}
                  {growthRates.bounties}%
                </span>
                <span className="ml-1">from last period</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Total Users */}
        {bountiesLoading ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <TrendingUp
                  className={cn(
                    "mr-1 h-3 w-3",
                    growthRates.users >= 0 ? "text-green-500" : "text-red-500"
                  )}
                />
                <span className={growthRates.users >= 0 ? "text-green-500" : "text-red-500"}>
                  {growthRates.users >= 0 ? "+" : ""}
                  {growthRates.users}%
                </span>
                <span className="ml-1">from last period</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Total Workspaces */}
        {bountiesLoading ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workspaces</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWorkspaces}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <TrendingUp
                  className={cn(
                    "mr-1 h-3 w-3",
                    growthRates.workspaces >= 0 ? "text-green-500" : "text-red-500"
                  )}
                />
                <span className={growthRates.workspaces >= 0 ? "text-green-500" : "text-red-500"}>
                  {growthRates.workspaces >= 0 ? "+" : ""}
                  {growthRates.workspaces}%
                </span>
                <span className="ml-1">from last period</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sats Distributed */}
        {bountiesLoading ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sats Distributed</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.paidOut.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <TrendingUp
                  className={cn(
                    "mr-1 h-3 w-3",
                    growthRates.revenue >= 0 ? "text-green-500" : "text-red-500"
                  )}
                />
                <span className={growthRates.revenue >= 0 ? "text-green-500" : "text-red-500"}>
                  {growthRates.revenue >= 0 ? "+" : ""}
                  {growthRates.revenue}%
                </span>
                <span className="ml-1">from last period</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-7 mb-8">
        {/* Bounty Status Overview */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Bounty Status Overview</CardTitle>
            <CardDescription>Current distribution of bounty statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {bountiesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Open Bounties */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium">Open</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{stats.openBounties}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{
                        width: `${stats.totalBounties > 0 ? (stats.openBounties / stats.totalBounties) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Assigned Bounties */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      <span className="text-sm font-medium">Assigned</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{stats.assignedBounties}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div
                      className="h-2 rounded-full bg-yellow-500"
                      style={{
                        width: `${stats.totalBounties > 0 ? (stats.assignedBounties / stats.totalBounties) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Completed Bounties */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span className="text-sm font-medium">Completed/Paid</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{stats.completedBounties}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div
                      className="h-2 rounded-full bg-green-500"
                      style={{
                        width: `${stats.totalBounties > 0 ? (stats.completedBounties / stats.totalBounties) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Platform Health Indicator */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {stats.totalBounties > 0
                        ? ((stats.completedBounties / stats.totalBounties) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Platform metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            {bountiesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Active Users</span>
                  </div>
                  <span className="text-sm font-bold">{stats.activeUsers}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                    <span className="text-sm">New Users (7d)</span>
                  </div>
                  <span className="text-sm font-bold">{stats.newUsersThisWeek}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Total Value (sats)</span>
                  </div>
                  <span className="text-sm font-bold">{stats.totalValue.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Avg. Completion</span>
                  </div>
                  <span className="text-sm font-bold">4.2 days</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 h-2 w-2 rounded-full",
                      activity.type === "bounty" && "bg-blue-500",
                      activity.type === "user" && "bg-green-500",
                      activity.type === "workspace" && "bg-purple-500",
                      activity.type === "payment" && "bg-orange-500"
                    )}
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/bounties">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Manage Bounties
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </Link>
            <Link href="/admin/workspaces">
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="mr-2 h-4 w-4" />
                Manage Workspaces
              </Button>
            </Link>
            <Link href="/admin/transactions">
              <Button variant="outline" className="w-full justify-start">
                <Wallet className="mr-2 h-4 w-4" />
                View Transactions
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="outline" className="w-full justify-start">
                <Activity className="mr-2 h-4 w-4" />
                Platform Analytics
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline" className="w-full justify-start">
                <AlertCircle className="mr-2 h-4 w-4" />
                Platform Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Platform Health Alert */}
      <Alert>
        <Activity className="h-4 w-4" />
        <AlertDescription>
          Platform health: <span className="font-semibold text-green-600">Good</span>. All systems
          operational. {stats.openBounties} open bounties, {stats.activeUsers} active users.
        </AlertDescription>
      </Alert>
    </div>
  );
}
