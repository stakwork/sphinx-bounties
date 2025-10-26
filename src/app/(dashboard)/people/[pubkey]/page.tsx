"use client";

import { use } from "react";
import Link from "next/link";
import { useGetUser, useGetUserStats } from "@/hooks/queries/use-user-queries";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AvatarWithFallback } from "@/components/common";
import {
  AlertCircle,
  Wallet,
  Trophy,
  Target,
  Briefcase,
  Github,
  Twitter,
  Calendar,
  TrendingUp,
  Clock,
  Award,
} from "lucide-react";

export default function ProfilePage({
  params: paramsPromise,
}: {
  params: Promise<{ pubkey: string }>;
}) {
  const params = use(paramsPromise);
  const pubkey = params.pubkey;

  const { data: userData, isLoading: userLoading } = useGetUser(pubkey);
  const { data: statsData, isLoading: statsLoading } = useGetUserStats(pubkey);

  if (userLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!userData?.user) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">User Not Found</h3>
        <p className="text-neutral-600 mb-4">
          This user doesn&apos;t exist or may have been deleted.
        </p>
        <Link href="/people">
          <Button variant="outline">Browse Users</Button>
        </Link>
      </div>
    );
  }

  const user = userData.user;
  const stats = statsData?.stats || user.stats;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <AvatarWithFallback src={user.avatarUrl} alt={user.alias || user.username} size="xl" />
            <div className="flex-1 space-y-2">
              <div>
                <h1 className="text-3xl font-bold">{user.alias || user.username}</h1>
                {user.alias && <p className="text-neutral-600">@{user.username}</p>}
              </div>
              {user.description && <p className="text-neutral-700 max-w-2xl">{user.description}</p>}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {user.githubVerified && user.githubUsername && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Github className="h-3 w-3" />
                    {user.githubUsername}
                  </Badge>
                )}
                {user.twitterVerified && user.twitterUsername && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Twitter className="h-3 w-3" />
                    {user.twitterUsername}
                  </Badge>
                )}
                {user.createdAt && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <Wallet className="h-8 w-8 text-primary-600 mx-auto" />
              <p className="text-2xl font-bold">
                {parseInt(stats.totalEarned || "0").toLocaleString()}
              </p>
              <p className="text-xs text-neutral-600">Total Earned (sats)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <Trophy className="h-8 w-8 text-green-600 mx-auto" />
              <p className="text-2xl font-bold">{stats.bountiesCompleted || 0}</p>
              <p className="text-xs text-neutral-600">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <Target className="h-8 w-8 text-blue-600 mx-auto" />
              <p className="text-2xl font-bold">{stats.activeBounties || 0}</p>
              <p className="text-xs text-neutral-600">Active</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <Briefcase className="h-8 w-8 text-purple-600 mx-auto" />
              <p className="text-2xl font-bold">{stats.bountiesCreated || 0}</p>
              <p className="text-xs text-neutral-600">Created</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <TrendingUp className="h-8 w-8 text-orange-600 mx-auto" />
              <p className="text-2xl font-bold">{stats.workspacesCount || 0}</p>
              <p className="text-xs text-neutral-600">Workspaces</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <Award className="h-8 w-8 text-yellow-600 mx-auto" />
              <p className="text-2xl font-bold">
                {stats.successRate ? `${stats.successRate}%` : "N/A"}
              </p>
              <p className="text-xs text-neutral-600">Success Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance & Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Performance
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-neutral-600 mb-1">Average Completion Time</p>
                <p className="text-2xl font-bold">
                  {stats.averageCompletionTime
                    ? `${stats.averageCompletionTime.toFixed(1)} days`
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 mb-1">Success Rate</p>
                <p className="text-2xl font-bold">
                  {stats.successRate ? `${stats.successRate}%` : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 mb-1">Total Bounties Assigned</p>
                <p className="text-2xl font-bold">{stats.bountiesAssigned || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Skills */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top Skills
            </h3>
            {stats.topSkills && stats.topSkills.length > 0 ? (
              <div className="space-y-3">
                {stats.topSkills.map((skill: { language: string; count: number }, idx: number) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{skill.language}</span>
                      <span className="text-sm text-neutral-600">
                        {skill.count} {skill.count === 1 ? "bounty" : "bounties"}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{
                          width: `${(skill.count / (stats.topSkills?.[0]?.count || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-600 text-center py-8">No skills data available yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href={`/people/${pubkey}/bounties`}>
          <Button variant="outline">
            <Briefcase className="h-4 w-4 mr-2" />
            View Created Bounties
          </Button>
        </Link>
        <Link href={`/people/${pubkey}/assigned`}>
          <Button variant="outline">
            <Target className="h-4 w-4 mr-2" />
            View Assigned Work
          </Button>
        </Link>
        <Link href={`/people/${pubkey}/workspaces`}>
          <Button variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            View Workspaces
          </Button>
        </Link>
      </div>
    </div>
  );
}
