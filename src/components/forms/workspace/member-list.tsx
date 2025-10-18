/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @next/next/no-img-element */
// @ts-nocheck
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormSelect } from "@/components/forms";
import { updateMemberRoleAction, removeMemberAction } from "@/actions";
import { showSuccess, showError } from "@/lib/toast";
import { WorkspaceRole } from "@prisma/client";

const roleOptions = [
  { value: WorkspaceRole.OWNER, label: "Owner" },
  { value: WorkspaceRole.ADMIN, label: "Admin" },
  { value: WorkspaceRole.CONTRIBUTOR, label: "Contributor" },
  { value: WorkspaceRole.VIEWER, label: "Viewer" },
];

interface Member {
  id: string;
  userPubkey: string;
  role: WorkspaceRole;
  joinedAt: Date;
  user: {
    username: string;
    alias?: string | null;
    avatarUrl?: string | null;
  };
}

interface MemberListProps {
  workspaceId: string;
  members: Member[];
  currentUserPubkey: string;
  isOwner: boolean;
  isAdmin: boolean;
  onUpdate?: () => void;
}

export function MemberList({
  workspaceId,
  members,
  currentUserPubkey,
  isOwner,
  isAdmin,
  onUpdate,
}: MemberListProps) {
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [newRole, setNewRole] = useState<WorkspaceRole | null>(null);
  const [removingMember, setRemovingMember] = useState<Member | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateRole = async () => {
    if (!editingMember || !newRole) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("role", newRole);

      const result = await updateMemberRoleAction(
        workspaceId,
        editingMember.id,
        formData
      );

      if (result.success) {
        showSuccess("Member role updated successfully!");
        setEditingMember(null);
        setNewRole(null);
        onUpdate?.();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to update role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!removingMember) return;

    setIsSubmitting(true);
    try {
      const result = await removeMemberAction(workspaceId, removingMember.id);

      if (result.success) {
        showSuccess("Member removed successfully!");
        setRemovingMember(null);
        onUpdate?.();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to remove member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEditRole = (member: Member) => {
    if (member.userPubkey === currentUserPubkey) return false;
    if (member.role === WorkspaceRole.OWNER) return false;
    return isOwner;
  };

  const canRemove = (member: Member) => {
    if (member.userPubkey === currentUserPubkey) return false;
    if (member.role === WorkspaceRole.OWNER) return false;
    return isOwner || isAdmin;
  };

  return (
    <>
      <div className="space-y-4">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex items-center gap-4">
              {member.user.avatarUrl && (
                <img
                  src={member.user.avatarUrl}
                  alt={member.user.username}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <div className="font-medium">
                  {member.user.alias || member.user.username}
                </div>
                <div className="text-sm text-muted-foreground">
                  @{member.user.username}
                </div>
              </div>
              <Badge variant={member.role === WorkspaceRole.OWNER ? "default" : "secondary"}>
                {member.role}
              </Badge>
            </div>

            <div className="flex gap-2">
              {canEditRole(member) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingMember(member);
                    setNewRole(member.role);
                  }}
                >
                  Change Role
                </Button>
              )}
              {canRemove(member) && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setRemovingMember(member)}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Member Role</DialogTitle>
            <DialogDescription>
              Change the role for {editingMember?.user.username}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <FormSelect
              label="New Role"
              placeholder="Select a role"
              options={roleOptions}
              value={newRole || ""}
              onValueChange={(value) => setNewRole(value as WorkspaceRole)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={isSubmitting || !newRole}>
              {isSubmitting ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!removingMember} onOpenChange={() => setRemovingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {removingMember?.user.username} from this
              workspace? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRemovingMember(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Removing..." : "Remove Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
