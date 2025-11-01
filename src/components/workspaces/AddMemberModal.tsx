"use client";

import { useState } from "react";
import { useAddMember } from "@/hooks/queries/use-workspace-queries";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";

interface AddMemberModalProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMemberModal({ workspaceId, open, onOpenChange }: AddMemberModalProps) {
  const [userPubkey, setUserPubkey] = useState("");
  const [role, setRole] = useState("CONTRIBUTOR");

  const addMember = useAddMember();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userPubkey.trim()) {
      return;
    }

    try {
      await addMember.mutateAsync({
        workspaceId,
        data: {
          userPubkey: userPubkey.trim(),
          role,
        },
      });
      setUserPubkey("");
      setRole("CONTRIBUTOR");
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
            <UserPlus className="h-5 w-5" />
            Add Member
          </DialogTitle>
          <DialogDescription>
            Add a new member to the workspace by their public key or username
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userPubkey">User Public Key or Username</Label>
            <Input
              id="userPubkey"
              placeholder="Enter public key or username..."
              value={userPubkey}
              onChange={(e) => setUserPubkey(e.target.value)}
              disabled={addMember.isPending}
              required
            />
            <p className="text-xs text-neutral-500">
              Enter the user&apos;s public key or username to add them to the workspace
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole} disabled={addMember.isPending}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONTRIBUTOR">Contributor</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-neutral-500">
              Contributors can work on bounties. Admins can manage workspace settings.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addMember.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addMember.isPending || !userPubkey.trim()}>
              {addMember.isPending ? "Adding..." : "Add Member"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
