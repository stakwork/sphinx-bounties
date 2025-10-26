"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BountyForm } from "@/components/bounties";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks";
import { AlertCircle } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  description: string | null;
}

export default function NewBountyPage() {
  const { user, isAuthenticated } = useAuth();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");

  // Fetch user's workspaces
  const { data: workspacesData, isLoading } = useQuery({
    queryKey: ["user-workspaces", user?.pubkey],
    queryFn: async () => {
      const response = await fetch("/api/workspaces");
      if (!response.ok) throw new Error("Failed to fetch workspaces");
      const result = await response.json();
      return result.data as Workspace[];
    },
    enabled: !!user,
  });

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-600">Please log in to create a bounty</p>
        </div>
      </div>
    );
  }

  const workspaces = workspacesData || [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Bounty</h1>
        <p className="text-neutral-600">Post a new bounty for your workspace</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : workspaces.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-neutral-300 rounded-lg">
          <AlertCircle className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Workspaces Found</h3>
          <p className="text-neutral-600 mb-4">
            You need to be a member of a workspace to create bounties.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Workspace Selector */}
          <div className="space-y-2">
            <Label htmlFor="workspace">
              Select Workspace <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId}>
              <SelectTrigger id="workspace">
                <SelectValue placeholder="Choose a workspace..." />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((workspace) => (
                  <SelectItem key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-neutral-500">
              Select the workspace where this bounty will be posted
            </p>
          </div>

          {/* Bounty Form */}
          {selectedWorkspaceId && (
            <div className="pt-4 border-t">
              <BountyForm workspaceId={selectedWorkspaceId} />
            </div>
          )}

          {!selectedWorkspaceId && (
            <div className="text-center py-8 text-neutral-500">
              Please select a workspace to continue
            </div>
          )}
        </div>
      )}
    </div>
  );
}
