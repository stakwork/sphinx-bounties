"use client";

import { useState } from "react";
import { useUpdateMemberRole } from "@/hooks/queries/use-workspace-queries";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield } from "lucide-react";
import type { WorkspaceMember } from "@/types";

interface UpdateMemberRoleDialogProps {
  workspaceId: string;
  member: WorkspaceMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdateMemberRoleDialog({
  workspaceId,
  member,
  open,
  onOpenChange,
}: UpdateMemberRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState(member.role);
  const updateMemberRole = useUpdateMemberRole();

  const handleUpdate = async () => {
    if (selectedRole === member.role) {
      onOpenChange(false);
      return;
    }

    try {
      await updateMemberRole.mutateAsync({
        workspaceId,
        userPubkey: member.userPubkey,
        data: { role: selectedRole },
      });
      onOpenChange(false);
    } catch (_error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Update Member Role
          </DialogTitle>
          <DialogDescription>
            Change the role and permissions for this workspace member
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <p className="font-semibold">{member.user.alias || member.user.username}</p>
            <p className="text-sm text-neutral-600">@{member.user.username}</p>
            <p className="text-sm text-neutral-500 mt-1">Current Role: {member.role}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">New Role</Label>
            <Select
              value={selectedRole}
              onValueChange={setSelectedRole}
              disabled={updateMemberRole.isPending}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONTRIBUTOR">Contributor</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-neutral-600 space-y-1 mt-2">
              <p>
                <strong>Contributor:</strong> Can work on bounties and view workspace details
              </p>
              <p>
                <strong>Admin:</strong> Can manage workspace settings, members, and bounties
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMemberRole.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={updateMemberRole.isPending || selectedRole === member.role}
          >
            {updateMemberRole.isPending ? "Updating..." : "Update Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
