"use client";

import { use } from "react";
import Link from "next/link";
import { useGetWorkspace } from "@/hooks/queries/use-workspace-queries";
import { useGetBountiesByWorkspace } from "@/hooks/queries/use-bounty-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AvatarWithFallback, CurrencyDisplay } from "@/components/common";
import { BountyCard } from "@/components/bounties";
import {
  AlertCircle,
  Users,
  Target,
  Calendar,
  Settings,
  Plus,
  ExternalLink,
  Github,
  Globe,
} from "lucide-react";
import type { BountyListItem, WorkspaceMember } from "@/types";

export default function WorkspaceDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const workspaceId = params.id;

  const { data: workspace, isLoading, error } = useGetWorkspace(workspaceId);
  const { data: bountiesData, isLoading: bountiesLoading } = useGetBountiesByWorkspace(
    workspaceId,
    { page: 1, pageSize: 6 }
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !workspace) {
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

  const isAdmin = workspace.role === "OWNER" || workspace.role === "ADMIN";
  const availableBudget = workspace.budget?.availableBudget
    ? parseInt(workspace.budget.availableBudget)
    : 0;

  const recentBounties = bountiesData?.data?.slice(0, 6) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="flex items-start gap-4">
          <AvatarWithFallback src={workspace.avatarUrl} alt={workspace.name} size="xl" />
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{workspace.name}</h1>
              <Badge variant="secondary">{workspace.role}</Badge>
            </div>
            {workspace.description && (
              <p className="text-neutral-600 max-w-2xl">{workspace.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-neutral-500">
              {workspace.websiteUrl && (
                <a
                  href={workspace.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary-600"
                >
                  <Globe className="h-4 w-4" />
                  Website
                </a>
              )}
              {workspace.githubUrl && (
                <a
                  href={workspace.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary-600"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Created {new Date(workspace.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <Link href={`/bounties/new?workspace=${workspaceId}`}>
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              New Bounty
            </Button>
          </Link>
          {isAdmin && (
            <Link href={`/workspaces/${workspaceId}/edit`}>
              <Button variant="outline" size="lg" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600">Active Bounties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary-600" />
              <p className="text-3xl font-bold">{workspace.bountyCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-600" />
              <p className="text-3xl font-bold">{workspace.memberCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600">Available Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <CurrencyDisplay amount={availableBudget} size="lg" className="text-3xl" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600">Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{workspace.activityCount || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Mission Statement */}
      {workspace.mission && (
        <Card>
          <CardHeader>
            <CardTitle>Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-700 whitespace-pre-wrap">{workspace.mission}</p>
          </CardContent>
        </Card>
      )}

      {/* Recent Bounties */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Recent Bounties</h2>
          <Link href={`/workspaces/${workspaceId}/bounties`}>
            <Button variant="ghost" className="gap-2">
              View All
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {bountiesLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        )}

        {!bountiesLoading && recentBounties.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Bounties Yet</h3>
              <p className="text-neutral-600 mb-4">
                Create your first bounty to get started with your workspace.
              </p>
              <Link href={`/bounties/new?workspace=${workspaceId}`}>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Bounty
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {!bountiesLoading && recentBounties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentBounties.map((bounty: BountyListItem) => (
              <BountyCard key={bounty.id} bounty={bounty} />
            ))}
          </div>
        )}
      </div>

      {/* Members Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Team Members</h2>
          <Link href={`/workspaces/${workspaceId}/members`}>
            <Button variant="ghost" className="gap-2">
              View All
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="py-6">
            <div className="flex flex-wrap gap-4">
              {workspace.members?.slice(0, 8).map((member: WorkspaceMember) => (
                <Link key={member.id} href={`/people/${member.userPubkey}`}>
                  <div className="flex items-center gap-2 hover:bg-neutral-50 p-2 rounded-lg transition-colors">
                    <AvatarWithFallback
                      src={member.user.avatarUrl}
                      alt={member.user.alias || member.user.username}
                      size="md"
                    />
                    <div>
                      <p className="font-medium text-sm">
                        {member.user.alias || member.user.username}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {workspace.memberCount > 8 && (
              <p className="text-sm text-neutral-500 mt-4">
                and {workspace.memberCount - 8} more members...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
