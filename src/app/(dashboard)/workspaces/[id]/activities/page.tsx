"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useGetWorkspace, useGetWorkspaceActivities } from "@/hooks/queries/use-workspace-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AvatarWithFallback } from "@/components/common";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Activity as ActivityIcon,
  UserPlus,
  UserMinus,
  Shield,
  Wallet,
  TrendingUp,
  TrendingDown,
  Settings,
  Filter,
} from "lucide-react";

interface Activity {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  timestamp: string;
  user: {
    pubkey: string;
    username: string;
    alias: string | null;
  };
}

const ACTIVITY_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    label: string;
  }
> = {
  MEMBER_ADDED: {
    icon: UserPlus,
    color: "text-green-600",
    bgColor: "bg-green-100",
    label: "Member Added",
  },
  MEMBER_REMOVED: {
    icon: UserMinus,
    color: "text-red-600",
    bgColor: "bg-red-100",
    label: "Member Removed",
  },
  ROLE_CHANGED: {
    icon: Shield,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    label: "Role Changed",
  },
  BUDGET_DEPOSITED: {
    icon: TrendingUp,
    color: "text-green-600",
    bgColor: "bg-green-100",
    label: "Budget Deposited",
  },
  BUDGET_WITHDRAWN: {
    icon: TrendingDown,
    color: "text-red-600",
    bgColor: "bg-red-100",
    label: "Budget Withdrawn",
  },
  SETTINGS_UPDATED: {
    icon: Settings,
    color: "text-neutral-600",
    bgColor: "bg-neutral-100",
    label: "Settings Updated",
  },
};

function getActivityDescription(activity: Activity): string {
  const details = activity.details as Record<string, string> | null;
  const userName = activity.user.alias || activity.user.username;

  switch (activity.action) {
    case "MEMBER_ADDED":
      return `${userName} added ${details?.memberName || "a new member"} to the workspace`;
    case "MEMBER_REMOVED":
      return `${userName} removed ${details?.memberName || "a member"} from the workspace`;
    case "ROLE_CHANGED":
      return `${userName} changed ${details?.memberName || "a member"}'s role to ${details?.newRole || ""}`;
    case "BUDGET_DEPOSITED":
      return `${userName} deposited ${details?.amount || ""} sats to the budget`;
    case "BUDGET_WITHDRAWN":
      return `${userName} withdrew ${details?.amount || ""} sats from the budget`;
    case "SETTINGS_UPDATED":
      return `${userName} updated workspace settings`;
    default:
      return `${userName} performed an action`;
  }
}

export default function WorkspaceActivitiesPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const workspaceId = params.id;

  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>("all");

  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspace(workspaceId);
  const { data: activitiesData, isLoading: activitiesLoading } = useGetWorkspaceActivities(
    workspaceId,
    { page, pageSize: 20 },
    actionFilter === "all" ? undefined : actionFilter
  );

  const activities = activitiesData?.activities || [];
  const pagination = activitiesData?.pagination;

  if (workspaceLoading || activitiesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Workspace Not Found</h3>
        <p className="text-neutral-600 mb-4">
          This workspace doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Link href="/workspaces">
          <Button variant="outline">Back to Workspaces</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{workspace.name} - Activity Feed</h1>
          <p className="text-neutral-600 mt-1">Track all workspace activities and changes</p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Filter className="h-4 w-4 text-neutral-400" />
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="MEMBER_ADDED">Member Added</SelectItem>
                <SelectItem value="MEMBER_REMOVED">Member Removed</SelectItem>
                <SelectItem value="ROLE_CHANGED">Role Changed</SelectItem>
                <SelectItem value="BUDGET_DEPOSITED">Budget Deposited</SelectItem>
                <SelectItem value="BUDGET_WITHDRAWN">Budget Withdrawn</SelectItem>
                <SelectItem value="SETTINGS_UPDATED">Settings Updated</SelectItem>
              </SelectContent>
            </Select>
            {actionFilter !== "all" && (
              <Button variant="ghost" size="sm" onClick={() => setActionFilter("all")}>
                Clear Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 && (
            <div className="text-center py-12">
              <ActivityIcon className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Activities</h3>
              <p className="text-neutral-600">
                {actionFilter !== "all"
                  ? "No activities found matching your filter."
                  : "No activities recorded yet for this workspace."}
              </p>
            </div>
          )}

          {activities.length > 0 && (
            <div className="space-y-4">
              {activities.map((activity: Activity) => {
                const config = ACTIVITY_CONFIG[activity.action] || {
                  icon: ActivityIcon,
                  color: "text-neutral-600",
                  bgColor: "bg-neutral-100",
                  label: activity.action,
                };
                const Icon = config.icon;

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    <div className={`p-2 rounded-full ${config.bgColor}`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-neutral-700">
                            {getActivityDescription(activity)}
                          </p>
                        </div>
                        <Link href={`/people/${activity.user.pubkey}`}>
                          <AvatarWithFallback
                            src={null}
                            alt={activity.user.alias || activity.user.username}
                            size="sm"
                          />
                        </Link>
                      </div>
                      <p className="text-xs text-neutral-500 mt-2">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-neutral-200">
              <p className="text-sm text-neutral-600">
                Showing {(pagination.page - 1) * pagination.perPage + 1} -{" "}
                {Math.min(pagination.page * pagination.perPage, pagination.total)} of{" "}
                {pagination.total} activities
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-neutral-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Wallet className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {activities.filter((a: Activity) => a.action.includes("BUDGET")).length}
              </p>
              <p className="text-xs text-neutral-600">Budget Activities</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <UserPlus className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {activities.filter((a: Activity) => a.action === "MEMBER_ADDED").length}
              </p>
              <p className="text-xs text-neutral-600">Members Added</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {activities.filter((a: Activity) => a.action === "ROLE_CHANGED").length}
              </p>
              <p className="text-xs text-neutral-600">Role Changes</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
