import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PaginationParams } from "@/types";
import { showSuccess, showError } from "@/lib/toast";

const commentKeys = {
  all: ["comments"] as const,
  lists: () => [...commentKeys.all, "list"] as const,
  list: (bountyId: string, pagination?: PaginationParams) =>
    [...commentKeys.lists(), bountyId, { pagination }] as const,
};

async function getComments(bountyId: string, pagination?: PaginationParams) {
  const params = new URLSearchParams();

  if (pagination?.page) params.append("page", pagination.page.toString());
  if (pagination?.pageSize) params.append("limit", pagination.pageSize.toString());

  const response = await fetch(`/api/bounties/${bountyId}/comments?${params.toString()}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch comments");
  }

  const result = await response.json();
  return result.data;
}

async function createComment(bountyId: string, content: string) {
  const response = await fetch(`/api/bounties/${bountyId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create comment");
  }

  const result = await response.json();
  return result.data;
}

async function updateComment(bountyId: string, commentId: string, content: string) {
  const response = await fetch(`/api/bounties/${bountyId}/comments/${commentId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update comment");
  }

  const result = await response.json();
  return result.data;
}

async function deleteComment(bountyId: string, commentId: string) {
  const response = await fetch(`/api/bounties/${bountyId}/comments/${commentId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete comment");
  }

  const result = await response.json();
  return result.data;
}

export function useGetBountyComments(bountyId: string, pagination?: PaginationParams) {
  return useQuery({
    queryKey: commentKeys.list(bountyId, pagination),
    queryFn: () => getComments(bountyId, pagination),
    enabled: !!bountyId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bountyId, content }: { bountyId: string; content: string }) =>
      createComment(bountyId, content),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(variables.bountyId) });
      showSuccess("Comment added successfully");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to add comment");
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bountyId,
      commentId,
      content,
    }: {
      bountyId: string;
      commentId: string;
      content: string;
    }) => updateComment(bountyId, commentId, content),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(variables.bountyId) });
      showSuccess("Comment updated successfully");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to update comment");
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bountyId, commentId }: { bountyId: string; commentId: string }) =>
      deleteComment(bountyId, commentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(variables.bountyId) });
      showSuccess("Comment deleted successfully");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to delete comment");
    },
  });
}
