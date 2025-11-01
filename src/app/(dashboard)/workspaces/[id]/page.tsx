"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useGetWorkspace, useUpdateWorkspace } from "@/hooks/queries/use-workspace-queries";
import { useGetBountiesByWorkspace } from "@/hooks/queries/use-bounty-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AvatarWithFallback, CurrencyDisplay } from "@/components/common";
import { BountyCard } from "@/components/bounties";
import { AvatarEditModal } from "@/components/workspaces";
import { formatDate } from "@/lib/utils/date";
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
  Edit,
  Clock,
} from "lucide-react";
import type { BountyListItem, WorkspaceMember } from "@/types";

export default function WorkspaceDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const workspaceId = params.id;

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const { data: workspace, isLoading, error } = useGetWorkspace(workspaceId);
  const { data: bountiesData, isLoading: bountiesLoading } = useGetBountiesByWorkspace(
    workspaceId,
    { page: 1, pageSize: 6 }
  );
  const updateMutation = useUpdateWorkspace();

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

  const handleAvatarUpdate = async (avatarUrl: string) => {
    await updateMutation.mutateAsync({
      id: workspaceId,
      data: { avatarUrl },
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 bg-gradient-to-br from-neutral-50 via-white to-neutral-50 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900 p-6 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm backdrop-blur-xl">
        <div className="flex items-start gap-6">
          <div className="relative group">
            <button
              onClick={() => isAdmin && setIsAvatarModalOpen(true)}
              className={`relative ${isAdmin ? "cursor-pointer" : "cursor-default"}`}
              disabled={!isAdmin}
            >
              <AvatarWithFallback
                src={workspace.avatarUrl}
                alt={workspace.name}
                fallbackText={workspace.name}
                size="xl"
                className="ring-4 ring-white dark:ring-neutral-950 shadow-lg transition-all group-hover:ring-primary-200 dark:group-hover:ring-primary-900"
              />
              {isAdmin && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all">
                  <Edit className="h-6 w-6 text-white" />
                </div>
              )}
            </button>
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-4xl font-bold bg-gradient-to-br from-neutral-900 to-neutral-700 dark:from-neutral-100 dark:to-neutral-300 bg-clip-text text-transparent">
                {workspace.name}
              </h1>
              <Badge variant="secondary" className="text-sm">
                {workspace.role}
              </Badge>
              {isAdmin && (
                <Link href={`/workspaces/${workspaceId}/edit`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-neutral-600 hover:text-primary-600"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                </Link>
              )}
            </div>
            {workspace.description && (
              <p className="text-neutral-700 dark:text-neutral-300 max-w-2xl text-lg leading-relaxed">
                {workspace.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400 flex-wrap">
              {workspace.websiteUrl && (
                <a
                  href={workspace.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  <span>Website</span>
                </a>
              )}
              {workspace.githubUrl && (
                <a
                  href={workspace.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Github className="h-4 w-4" />
                  <span>GitHub</span>
                </a>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>Created {formatDate(workspace.createdAt)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>Updated {formatDate(workspace.updatedAt)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link href={`/bounties/new?workspace=${workspaceId}`}>
            <Button size="lg" className="gap-2 shadow-lg shadow-primary-500/20">
              <Plus className="h-5 w-5" />
              New Bounty
            </Button>
          </Link>
          {isAdmin && (
            <Link href={`/workspaces/${workspaceId}/edit`}>
              <Button variant="outline" size="lg" className="gap-2">
                <Settings className="h-5 w-5" />
                Settings
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-950 border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-xl hover:shadow-lg hover:shadow-primary-500/5 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Active Bounties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Target className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <p className="text-3xl font-bold bg-gradient-to-br from-neutral-900 to-neutral-700 dark:from-neutral-100 dark:to-neutral-300 bg-clip-text text-transparent">
                {workspace.bountyCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-950 border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-xl hover:shadow-lg hover:shadow-secondary-500/5 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg">
                <Users className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
              </div>
              <p className="text-3xl font-bold bg-gradient-to-br from-neutral-900 to-neutral-700 dark:from-neutral-100 dark:to-neutral-300 bg-clip-text text-transparent">
                {workspace.memberCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-950 border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-xl hover:shadow-lg hover:shadow-tertiary-500/5 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Available Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CurrencyDisplay amount={availableBudget} size="lg" className="text-3xl font-bold" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-950 border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-xl hover:shadow-lg hover:shadow-accent-500/5 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent-100 dark:bg-accent-900/30 rounded-lg">
                <Calendar className="h-5 w-5 text-accent-600 dark:text-accent-400" />
              </div>
              <p className="text-3xl font-bold bg-gradient-to-br from-neutral-900 to-neutral-700 dark:from-neutral-100 dark:to-neutral-300 bg-clip-text text-transparent">
                {workspace.activityCount || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mission Statement */}
      {workspace.mission && (
        <Card className="bg-gradient-to-br from-primary-50/50 to-white dark:from-primary-950/20 dark:to-neutral-950 border-primary-200/50 dark:border-primary-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Target className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <span>Mission</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
              {workspace.mission}
            </p>
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
                      fallbackText={member.user.alias || member.user.username}
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

      {/* Avatar Edit Modal */}
      {isAdmin && (
        <AvatarEditModal
          open={isAvatarModalOpen}
          onOpenChange={setIsAvatarModalOpen}
          currentAvatarUrl={workspace.avatarUrl || undefined}
          workspaceName={workspace.name}
          websiteUrl={workspace.websiteUrl || undefined}
          onSave={handleAvatarUpdate}
        />
      )}
    </div>
  );
}
