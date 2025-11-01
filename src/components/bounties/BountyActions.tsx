"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth, usePermissions } from "@/hooks";
import { useMyBountyRequest, useCancelBountyRequest } from "@/hooks/queries";
import { BountyStatus, BountyRequestStatus } from "@/types/enums";
import type { BountyDetail } from "@/types";
import { Loader2, Edit, Upload, CheckCircle, DollarSign, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api/api-fetch";
import { API_ROUTES } from "@/constants";
import { RequestBountyModal } from "./RequestBountyModal";

interface BountyActionsProps {
  bounty: BountyDetail;
}

export function BountyActions({ bounty }: BountyActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isAdmin } = usePermissions(bounty.workspace.id);

  const [showRequestModal, setShowRequestModal] = useState(false);

  const { data: myRequest } = useMyBountyRequest(bounty.id);
  const cancelRequestMutation = useCancelBountyRequest();

  const handleRequestToWork = () => {
    setShowRequestModal(true);
  };

  const handleCancelRequest = () => {
    if (myRequest?.id) {
      cancelRequestMutation.mutate({
        bountyId: bounty.id,
        requestId: myRequest.id,
      });
    }
  };

  const handleSubmitProof = () => {
    // Scroll to proof submissions section
    const proofsSection = document.getElementById("proof-submissions");
    if (proofsSection) {
      proofsSection.scrollIntoView({ behavior: "smooth" });
      // Trigger the proof submission modal via a custom event
      setTimeout(() => {
        const event = new CustomEvent("openProofSubmission");
        window.dispatchEvent(event);
      }, 300);
    }
  };

  const completeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch(
        API_ROUTES.WORKSPACES.COMPLETE_BOUNTY(bounty.workspace.id, bounty.id),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to complete bounty");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Bounty marked as completed!");
      queryClient.invalidateQueries({ queryKey: ["bounty", bounty.id] });
      queryClient.invalidateQueries({ queryKey: ["bounties"] });
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to complete bounty");
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch(
        API_ROUTES.WORKSPACES.MARK_PAID(bounty.workspace.id, bounty.id),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to mark as paid");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Bounty marked as paid!");
      queryClient.invalidateQueries({ queryKey: ["bounty", bounty.id] });
      queryClient.invalidateQueries({ queryKey: ["bounties"] });
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to mark as paid");
    },
  });

  const handleComplete = () => {
    if (confirm("Are you sure you want to mark this bounty as completed?")) {
      completeMutation.mutate();
    }
  };

  const handleMarkPaid = () => {
    if (confirm("Are you sure you want to mark this bounty as paid?")) {
      markPaidMutation.mutate();
    }
  };

  const isAssignee = user && bounty.assignee && bounty.assignee.pubkey === user.pubkey;

  const hasPendingRequest = myRequest?.status === BountyRequestStatus.PENDING;

  const showRequestButton =
    bounty.status === BountyStatus.OPEN && user && !bounty.assignee && !myRequest;

  const showCancelRequestButton = bounty.status === BountyStatus.OPEN && hasPendingRequest;

  const showRequestStatusBadge = myRequest && bounty.status === BountyStatus.OPEN;

  const showSubmitProofButton = bounty.status === BountyStatus.ASSIGNED && isAssignee;

  const showCompleteButton = bounty.status === BountyStatus.IN_REVIEW && isAdmin;

  const showMarkPaidButton = bounty.status === BountyStatus.COMPLETED && isAdmin;

  const showEditButton = isAdmin && bounty.status !== BountyStatus.PAID;

  if (
    !showRequestButton &&
    !showCancelRequestButton &&
    !showRequestStatusBadge &&
    !showSubmitProofButton &&
    !showCompleteButton &&
    !showMarkPaidButton &&
    !showEditButton
  ) {
    return null;
  }

  const isLoading =
    cancelRequestMutation.isPending || completeMutation.isPending || markPaidMutation.isPending;

  return (
    <div className="flex items-center gap-3 pt-6 border-t border-neutral-200">
      {showRequestButton && (
        <Button
          onClick={handleRequestToWork}
          disabled={isLoading}
          size="lg"
          className="flex-1 sm:flex-none"
        >
          Request to Work
        </Button>
      )}

      {showCancelRequestButton && (
        <Button
          onClick={handleCancelRequest}
          disabled={isLoading}
          variant="outline"
          size="lg"
          className="flex-1 sm:flex-none"
        >
          {cancelRequestMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {!cancelRequestMutation.isPending && <XCircle className="h-4 w-4 mr-2" />}
          Cancel Request
        </Button>
      )}

      {showRequestStatusBadge && myRequest && (
        <Badge
          variant={
            myRequest.status === BountyRequestStatus.PENDING
              ? "default"
              : myRequest.status === BountyRequestStatus.APPROVED
                ? "secondary"
                : "destructive"
          }
          className="flex items-center gap-1.5 px-3 py-1.5"
        >
          <Clock className="h-3.5 w-3.5" />
          {myRequest.status === BountyRequestStatus.PENDING && "Request Pending"}
          {myRequest.status === BountyRequestStatus.APPROVED && "Request Approved"}
          {myRequest.status === BountyRequestStatus.REJECTED && "Request Rejected"}
        </Badge>
      )}

      {showSubmitProofButton && (
        <Button
          onClick={handleSubmitProof}
          disabled={isLoading}
          size="lg"
          className="flex-1 sm:flex-none"
        >
          <Upload className="h-4 w-4 mr-2" />
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
          {completeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {!completeMutation.isPending && <CheckCircle className="h-4 w-4 mr-2" />}
          Mark Complete
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
          {markPaidMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {!markPaidMutation.isPending && <DollarSign className="h-4 w-4 mr-2" />}
          Mark as Paid
        </Button>
      )}

      {showEditButton && (
        <Link href={`/bounties/${bounty.id}/edit`}>
          <Button variant="outline" size="lg" className="flex-1 sm:flex-none">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </Link>
      )}

      <RequestBountyModal
        open={showRequestModal}
        onOpenChange={setShowRequestModal}
        bountyId={bounty.id}
        bountyTitle={bounty.title}
      />
    </div>
  );
}
