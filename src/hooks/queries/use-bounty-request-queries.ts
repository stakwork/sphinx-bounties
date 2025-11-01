import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ROUTES } from "@/constants";
import { showSuccess, showError } from "@/lib/toast";
import type {
  BountyRequest,
  CreateBountyRequestResponse,
  ListBountyRequestsResponse,
  ReviewBountyRequestResponse,
  DeleteBountyRequestResponse,
  BountyRequestStatus,
} from "@/types";
import { bountyKeys } from "./use-bounty-queries";

export const bountyRequestKeys = {
  all: ["bountyRequests"] as const,
  lists: () => [...bountyRequestKeys.all, "list"] as const,
  list: (bountyId: string, status?: BountyRequestStatus) =>
    [...bountyRequestKeys.lists(), bountyId, status] as const,
  myRequest: (bountyId: string) => [...bountyRequestKeys.all, "my", bountyId] as const,
};

interface CreateRequestInput {
  bountyId: string;
  message?: string;
}

interface ReviewRequestInput {
  bountyId: string;
  requestId: string;
  action: "approve" | "reject";
  reviewNote?: string;
}

async function fetchBountyRequests(
  bountyId: string,
  status?: BountyRequestStatus
): Promise<ListBountyRequestsResponse> {
  const url = new URL(API_ROUTES.BOUNTIES.REQUESTS(bountyId), window.location.origin);
  if (status) {
    url.searchParams.set("status", status);
  }

  const response = await fetch(url.toString(), {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch requests");
  }

  const result = await response.json();
  return result.data;
}

async function fetchMyBountyRequest(bountyId: string): Promise<BountyRequest | null> {
  const response = await fetch(API_ROUTES.BOUNTIES.REQUESTS(bountyId), {
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 403) {
      return null;
    }
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch request");
  }

  const result = await response.json();
  const requests = result.data.requests as BountyRequest[];

  const currentUserPubkey =
    typeof window !== "undefined" ? localStorage.getItem("userPubkey") : null;

  if (!currentUserPubkey) return null;

  return requests.find((req) => req.requesterPubkey === currentUserPubkey) || null;
}

async function createBountyRequest(
  input: CreateRequestInput
): Promise<CreateBountyRequestResponse> {
  const response = await fetch(API_ROUTES.BOUNTIES.REQUESTS(input.bountyId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ message: input.message }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to create request");
  }

  const result = await response.json();
  return result.data;
}

async function reviewBountyRequest(
  input: ReviewRequestInput
): Promise<ReviewBountyRequestResponse> {
  const response = await fetch(API_ROUTES.BOUNTIES.REQUEST_BY_ID(input.bountyId, input.requestId), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      action: input.action,
      reviewNote: input.reviewNote,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to review request");
  }

  const result = await response.json();
  return result.data;
}

async function cancelBountyRequest(
  bountyId: string,
  requestId: string
): Promise<DeleteBountyRequestResponse> {
  const response = await fetch(API_ROUTES.BOUNTIES.REQUEST_BY_ID(bountyId, requestId), {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to cancel request");
  }

  const result = await response.json();
  return result.data;
}

export function useBountyRequests(bountyId: string, status?: BountyRequestStatus) {
  return useQuery({
    queryKey: bountyRequestKeys.list(bountyId, status),
    queryFn: () => fetchBountyRequests(bountyId, status),
    enabled: !!bountyId,
  });
}

export function useMyBountyRequest(bountyId: string) {
  return useQuery({
    queryKey: bountyRequestKeys.myRequest(bountyId),
    queryFn: () => fetchMyBountyRequest(bountyId),
    enabled: !!bountyId,
  });
}

export function useCreateBountyRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBountyRequest,
    onSuccess: (_, variables) => {
      showSuccess("Request submitted successfully!");
      queryClient.invalidateQueries({
        queryKey: bountyRequestKeys.list(variables.bountyId),
      });
      queryClient.invalidateQueries({
        queryKey: bountyRequestKeys.myRequest(variables.bountyId),
      });
      queryClient.invalidateQueries({
        queryKey: bountyKeys.detail(variables.bountyId),
      });
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to submit request");
    },
  });
}

export function useReviewBountyRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reviewBountyRequest,
    onSuccess: (data, variables) => {
      const action = variables.action === "approve" ? "approved" : "rejected";
      showSuccess(`Request ${action} successfully!`);

      queryClient.invalidateQueries({
        queryKey: bountyRequestKeys.list(variables.bountyId),
      });
      queryClient.invalidateQueries({
        queryKey: bountyKeys.detail(variables.bountyId),
      });
      queryClient.invalidateQueries({
        queryKey: bountyKeys.all,
      });
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to review request");
    },
  });
}

export function useCancelBountyRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bountyId, requestId }: { bountyId: string; requestId: string }) =>
      cancelBountyRequest(bountyId, requestId),
    onSuccess: (_, variables) => {
      showSuccess("Request cancelled successfully");
      queryClient.invalidateQueries({
        queryKey: bountyRequestKeys.list(variables.bountyId),
      });
      queryClient.invalidateQueries({
        queryKey: bountyRequestKeys.myRequest(variables.bountyId),
      });
      queryClient.invalidateQueries({
        queryKey: bountyKeys.detail(variables.bountyId),
      });
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to cancel request");
    },
  });
}
