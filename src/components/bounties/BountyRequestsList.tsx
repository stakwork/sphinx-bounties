"use client";

import { useState } from "react";
import { useBountyRequests, useReviewBountyRequest } from "@/hooks/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AvatarWithFallback } from "@/components/common";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BountyRequestStatus } from "@/types/enums";
import { CheckCircle, XCircle, Clock, Users } from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import type { BountyDetail, BountyRequest } from "@/types";

interface BountyRequestsListProps {
  bounty: BountyDetail;
}

interface ReviewDialogState {
  isOpen: boolean;
  request: BountyRequest | null;
  action: "approve" | "reject" | null;
}

export function BountyRequestsList({ bounty }: BountyRequestsListProps) {
  const [statusFilter, setStatusFilter] = useState<BountyRequestStatus | undefined>(undefined);
  const [reviewDialog, setReviewDialog] = useState<ReviewDialogState>({
    isOpen: false,
    request: null,
    action: null,
  });
  const [reviewNote, setReviewNote] = useState("");

  const { data, isLoading } = useBountyRequests(bounty.id, statusFilter);
  const reviewMutation = useReviewBountyRequest();

  const requests = data?.requests || [];
  const pendingCount = requests.filter(
    (r: BountyRequest) => r.status === BountyRequestStatus.PENDING
  ).length;

  const handleOpenReviewDialog = (request: BountyRequest, action: "approve" | "reject") => {
    setReviewDialog({ isOpen: true, request, action });
    setReviewNote("");
  };

  const handleCloseReviewDialog = () => {
    setReviewDialog({ isOpen: false, request: null, action: null });
    setReviewNote("");
  };

  const handleSubmitReview = () => {
    if (!reviewDialog.request || !reviewDialog.action) return;

    reviewMutation.mutate(
      {
        bountyId: bounty.id,
        requestId: reviewDialog.request.id,
        action: reviewDialog.action,
        reviewNote: reviewNote.trim() || undefined,
      },
      {
        onSuccess: () => {
          handleCloseReviewDialog();
        },
      }
    );
  };

  const getStatusBadge = (status: BountyRequestStatus) => {
    switch (status) {
      case BountyRequestStatus.PENDING:
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case BountyRequestStatus.APPROVED:
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case BountyRequestStatus.REJECTED:
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-neutral-600" />
          <h3 className="text-lg font-semibold">Work Requests</h3>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-neutral-600" />
          <h3 className="text-lg font-semibold">Work Requests</h3>
        </div>
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto mb-3 text-neutral-400" />
          <p className="text-neutral-600">No work requests yet</p>
          <p className="text-sm text-neutral-500 mt-1">Requests from hunters will appear here</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-neutral-600" />
          <h3 className="text-lg font-semibold">
            Work Requests
            {pendingCount > 0 && (
              <span className="ml-2 text-sm font-normal text-neutral-600">
                ({pendingCount} pending)
              </span>
            )}
          </h3>
        </div>
      </div>

      <Tabs
        value={statusFilter || "all"}
        onValueChange={(v) => setStatusFilter(v === "all" ? undefined : (v as BountyRequestStatus))}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value={BountyRequestStatus.PENDING}>Pending</TabsTrigger>
          <TabsTrigger value={BountyRequestStatus.APPROVED}>Approved</TabsTrigger>
          <TabsTrigger value={BountyRequestStatus.REJECTED}>Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter || "all"} className="mt-4 space-y-3">
          {requests.map((request) => (
            <Card key={request.id} className="p-4">
              <div className="flex items-start gap-4">
                <AvatarWithFallback
                  src={request.requester.avatarUrl}
                  alt={request.requester.username}
                  fallbackText={request.requester.username}
                  size="md"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">
                      {request.requester.alias || request.requester.username}
                    </p>
                    {getStatusBadge(request.status)}
                  </div>

                  <p className="text-sm text-neutral-600 mb-2">
                    Requested {formatDate(request.createdAt)}
                  </p>

                  {request.message && (
                    <div className="bg-neutral-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                        {request.message}
                      </p>
                    </div>
                  )}

                  {request.status === BountyRequestStatus.PENDING && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => handleOpenReviewDialog(request, "approve")}
                        disabled={reviewMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenReviewDialog(request, "reject")}
                        disabled={reviewMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {request.status !== BountyRequestStatus.PENDING && request.reviewer && (
                    <p className="text-xs text-neutral-500 mt-2">
                      Reviewed by {request.reviewer.alias || request.reviewer.username}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={reviewDialog.isOpen} onOpenChange={handleCloseReviewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {reviewDialog.action === "approve" ? "Approve" : "Reject"} Request
            </DialogTitle>
            <DialogDescription>
              {reviewDialog.action === "approve"
                ? "Approving this request will automatically assign the bounty to this hunter."
                : "Rejecting this request will notify the hunter."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {reviewDialog.request && (
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <AvatarWithFallback
                  src={reviewDialog.request.requester.avatarUrl}
                  alt={reviewDialog.request.requester.username}
                  fallbackText={reviewDialog.request.requester.username}
                  size="sm"
                />
                <div>
                  <p className="font-medium">
                    {reviewDialog.request.requester.alias ||
                      reviewDialog.request.requester.username}
                  </p>
                  <p className="text-sm text-neutral-600">
                    @{reviewDialog.request.requester.username}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Note (Optional)</label>
              <Textarea
                placeholder="Add a note for the hunter..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                maxLength={500}
                className="min-h-[100px]"
              />
              <p className="text-xs text-neutral-500 text-right">
                {reviewNote.length} / 500 characters
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseReviewDialog}
                disabled={reviewMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant={reviewDialog.action === "approve" ? "default" : "destructive"}
                onClick={handleSubmitReview}
                disabled={reviewMutation.isPending}
              >
                {reviewMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {reviewDialog.action === "approve" ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve & Assign
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Request
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
