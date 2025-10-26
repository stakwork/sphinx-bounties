"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useGetWorkspace, useGetWorkspaceMembers } from "@/hooks/queries/use-workspace-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AvatarWithFallback } from "@/components/common";
import {
  AddMemberModal,
  RemoveMemberDialog,
  UpdateMemberRoleDialog,
} from "@/components/workspaces";
import { AlertCircle, Search, UserPlus, Calendar, Crown, Shield, User } from "lucide-react";
import type { WorkspaceMember } from "@/types";

const ROLE_ICONS = {
  OWNER: Crown,
  ADMIN: Shield,
  CONTRIBUTOR: User,
};

const ROLE_COLORS = {
  OWNER: "text-yellow-600",
  ADMIN: "text-blue-600",
  CONTRIBUTOR: "text-green-600",
};

export default function WorkspaceMembersPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const workspaceId = params.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isUpdateRoleDialogOpen, setIsUpdateRoleDialogOpen] = useState(false);

  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspace(workspaceId);
  const { data: membersData, isLoading: membersLoading } = useGetWorkspaceMembers(workspaceId);

  const isAdmin = workspace?.role === "OWNER" || workspace?.role === "ADMIN";
  const isOwner = workspace?.role === "OWNER";

  // Filter members based on search
  const filteredMembers =
    membersData?.members?.filter((member: WorkspaceMember) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        member.user.username.toLowerCase().includes(searchLower) ||
        member.user.alias?.toLowerCase().includes(searchLower) ||
        member.role.toLowerCase().includes(searchLower)
      );
    }) || [];

  const handleRemoveMember = (member: WorkspaceMember) => {
    setSelectedMember(member);
    setIsRemoveDialogOpen(true);
  };

  const handleUpdateRole = (member: WorkspaceMember) => {
    setSelectedMember(member);
    setIsUpdateRoleDialogOpen(true);
  };

  if (workspaceLoading || membersLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
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
          <h1 className="text-3xl font-bold">{workspace.name} - Members</h1>
          <p className="text-neutral-600 mt-1">Manage workspace members and their roles</p>
        </div>
        {isAdmin && (
          <Button size="lg" className="gap-2" onClick={() => setIsAddMemberOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Add Member
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search members by name or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <div className="space-y-3">
        {filteredMembers.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "No Members Found" : "No Members Yet"}
              </h3>
              <p className="text-neutral-600">
                {searchQuery
                  ? "Try adjusting your search criteria"
                  : "Add members to start collaborating"}
              </p>
            </CardContent>
          </Card>
        )}

        {filteredMembers.map((member: WorkspaceMember) => {
          const RoleIcon = ROLE_ICONS[member.role as keyof typeof ROLE_ICONS] || User;
          const roleColor =
            ROLE_COLORS[member.role as keyof typeof ROLE_COLORS] || "text-neutral-600";
          const canModify = isOwner && member.role !== "OWNER";
          const canRemove = isAdmin && member.userPubkey !== workspace.ownerPubkey;

          return (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Link href={`/people/${member.userPubkey}`}>
                      <AvatarWithFallback
                        src={member.user.avatarUrl}
                        alt={member.user.alias || member.user.username}
                        size="lg"
                      />
                    </Link>
                    <div>
                      <Link href={`/people/${member.userPubkey}`}>
                        <h3 className="font-semibold text-lg hover:text-primary-600 transition-colors">
                          {member.user.alias || member.user.username}
                        </h3>
                      </Link>
                      <p className="text-sm text-neutral-600">@{member.user.username}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="gap-1">
                          <RoleIcon className={`h-3 w-3 ${roleColor}`} />
                          {member.role}
                        </Badge>
                        <span className="text-xs text-neutral-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {(canModify || canRemove) && (
                    <div className="flex items-center gap-2">
                      {canModify && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateRole(member)}
                        >
                          Change Role
                        </Button>
                      )}
                      {canRemove && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleRemoveMember(member)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Stats Footer */}
      <Card>
        <CardHeader>
          <CardTitle>Member Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-neutral-600 mb-1">Total Members</p>
              <p className="text-3xl font-bold">{membersData?.members?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 mb-1">Admins</p>
              <p className="text-3xl font-bold">
                {membersData?.members?.filter(
                  (m: WorkspaceMember) => m.role === "ADMIN" || m.role === "OWNER"
                ).length || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 mb-1">Contributors</p>
              <p className="text-3xl font-bold">
                {membersData?.members?.filter((m: WorkspaceMember) => m.role === "CONTRIBUTOR")
                  .length || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {isAdmin && (
        <AddMemberModal
          workspaceId={workspaceId}
          open={isAddMemberOpen}
          onOpenChange={setIsAddMemberOpen}
        />
      )}

      {selectedMember && (
        <>
          <RemoveMemberDialog
            workspaceId={workspaceId}
            member={selectedMember}
            open={isRemoveDialogOpen}
            onOpenChange={setIsRemoveDialogOpen}
          />
          {isOwner && (
            <UpdateMemberRoleDialog
              workspaceId={workspaceId}
              member={selectedMember}
              open={isUpdateRoleDialogOpen}
              onOpenChange={setIsUpdateRoleDialogOpen}
            />
          )}
        </>
      )}
    </div>
  );
}
