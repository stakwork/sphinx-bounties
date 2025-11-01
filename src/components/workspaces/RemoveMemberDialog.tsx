"use client";

import { useRemoveMember } from "@/hooks/queries/use-workspace-queries";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { WorkspaceMember } from "@/types";

interface RemoveMemberDialogProps {
  workspaceId: string;
  member: WorkspaceMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RemoveMemberDialog({
  workspaceId,
  member,
  open,
  onOpenChange,
}: RemoveMemberDialogProps) {
  const removeMember = useRemoveMember();

  const handleRemove = async () => {
    try {
      await removeMember.mutateAsync({
        workspaceId,
        userPubkey: member.userPubkey,
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
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Remove Member
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to remove this member from the workspace?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <p className="font-semibold">{member.user.alias || member.user.username}</p>
            <p className="text-sm text-neutral-600">@{member.user.username}</p>
            <p className="text-sm text-neutral-500 mt-1">Role: {member.role}</p>
          </div>

          <p className="text-sm text-neutral-600 mt-4">
            This member will lose access to the workspace and all its bounties. This action cannot
            be undone.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={removeMember.isPending}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleRemove} disabled={removeMember.isPending}>
            {removeMember.isPending ? "Removing..." : "Remove Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
