"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth, usePermissions } from "@/hooks";
import { BountyStatus } from "@/types/enums";
import type { BountyDetail } from "@/types";
import { Loader2 } from "lucide-react";

interface BountyActionsProps {
  bounty: BountyDetail;
}

export function BountyActions({ bounty }: BountyActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isAdmin } = usePermissions(bounty.workspace.id);

  const claimMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const response = await fetch(
        `/api/workspaces/${bounty.workspace.id}/bounties/${bounty.id}/claim`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to claim bounty");
      }

      return await response.json();
    },
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["bounty", bounty.id] });
      const previousBounty = queryClient.getQueryData(["bounty", bounty.id]);

      queryClient.setQueryData(["bounty", bounty.id], (old: unknown) => {
        const oldData = old as { success: boolean; data: BountyDetail } | undefined;
        if (!oldData) return old;

        return {
          ...oldData,
          data: {
            ...oldData.data,
            status: BountyStatus.ASSIGNED,
            assignee: user
              ? {
                  pubkey: user.pubkey,
                  username: user.username,
                  alias: user.alias,
                  avatarUrl: user.avatarUrl,
                  description: null,
                  githubUsername: null,
                  twitterUsername: null,
                }
              : null,
            assignedAt: new Date(),
          },
        };
      });

      return { previousBounty };
    },
    onSuccess: () => {
      toast.success("Bounty claimed successfully!");
      queryClient.invalidateQueries({ queryKey: ["bounty", bounty.id] });
      queryClient.invalidateQueries({ queryKey: ["bounties"] });
      router.refresh();
    },
    onError: (error: Error, _variables, context) => {
      toast.error(error.message || "Failed to claim bounty");
      if (context?.previousBounty) {
        queryClient.setQueryData(["bounty", bounty.id], context.previousBounty);
      }
    },
  });

  const unclaimMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/workspaces/${bounty.workspace.id}/bounties/${bounty.id}/unclaim`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to unclaim bounty");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Bounty unclaimed successfully!");
      queryClient.invalidateQueries({ queryKey: ["bounty", bounty.id] });
      queryClient.invalidateQueries({ queryKey: ["bounties"] });
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to unclaim bounty");
    },
  });

  const handleClaim = () => {
    claimMutation.mutate();
  };

  const handleUnclaim = () => {
    unclaimMutation.mutate();
  };

  const handleSubmitProof = () => {
    // TODO: Open proof submission modal
    toast.info("Proof submission coming soon!");
  };

  const handleComplete = () => {
    // TODO: Open complete/review modal
    toast.info("Review and complete coming soon!");
  };

  const handleMarkPaid = () => {
    // TODO: Implement mark as paid action
    toast.info("Mark as paid coming soon!");
  };

  // Check if current user is the assignee
  const isAssignee = user && bounty.assignee && bounty.assignee.pubkey === user.pubkey;

  // Determine which actions to show based on status and permissions
  const showClaimButton = bounty.status === BountyStatus.OPEN && !bounty.assignee && user;

  const showUnclaimButton = bounty.status === BountyStatus.ASSIGNED && isAssignee;

  const showSubmitProofButton = bounty.status === BountyStatus.ASSIGNED && isAssignee;

  const showCompleteButton = bounty.status === BountyStatus.IN_REVIEW && isAdmin;

  const showMarkPaidButton = bounty.status === BountyStatus.COMPLETED && isAdmin;

  // If no actions available, don't render anything
  if (
    !showClaimButton &&
    !showUnclaimButton &&
    !showSubmitProofButton &&
    !showCompleteButton &&
    !showMarkPaidButton
  ) {
    return null;
  }

  const isLoading = claimMutation.isPending || unclaimMutation.isPending;

  return (
    <div className="flex items-center gap-3 pt-6 border-t border-neutral-200">
      {showClaimButton && (
        <Button
          onClick={handleClaim}
          disabled={isLoading}
          size="lg"
          className="flex-1 sm:flex-none"
        >
          {claimMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Claim Bounty
        </Button>
      )}

      {showUnclaimButton && (
        <Button
          onClick={handleUnclaim}
          disabled={isLoading}
          variant="outline"
          size="lg"
          className="flex-1 sm:flex-none"
        >
          {unclaimMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Unclaim
        </Button>
      )}

      {showSubmitProofButton && (
        <Button
          onClick={handleSubmitProof}
          disabled={isLoading}
          size="lg"
          className="flex-1 sm:flex-none"
        >
          Submit Proof
        </Button>
      )}

      {showCompleteButton && (
        <Button
          onClick={handleComplete}
          disabled={isLoading}
          size="lg"
          className="flex-1 sm:flex-none"
        >
          Review & Complete
        </Button>
      )}

      {showMarkPaidButton && (
        <Button
          onClick={handleMarkPaid}
          disabled={isLoading}
          variant="outline"
          size="lg"
          className="flex-1 sm:flex-none"
        >
          Mark as Paid
        </Button>
      )}
    </div>
  );
}
