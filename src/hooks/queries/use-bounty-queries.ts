import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  bountyQueries,
  type BountyFilters,
  type BountySortParams,
} from "@/services/bounty/queries";
import type { PaginationParams } from "@/types";
import {
  createBountyAction,
  updateBountyAction,
  assignBountyAction,
  submitProofAction,
  reviewProofAction,
} from "@/actions";
import { showSuccess, showError } from "@/lib/toast";

export const bountyKeys = {
  all: ["bounties"] as const,
  lists: () => [...bountyKeys.all, "list"] as const,
  list: (filters?: BountyFilters, pagination?: PaginationParams, sort?: BountySortParams) =>
    [...bountyKeys.lists(), { filters, pagination, sort }] as const,
  details: () => [...bountyKeys.all, "detail"] as const,
  detail: (id: string) => [...bountyKeys.details(), id] as const,
  proofs: (bountyId: string) => [...bountyKeys.all, "proofs", bountyId] as const,
  proof: (proofId: string) => [...bountyKeys.all, "proof", proofId] as const,
  workspace: (workspaceId: string) => [...bountyKeys.all, "workspace", workspaceId] as const,
  assignee: (assigneePubkey: string) => [...bountyKeys.all, "assignee", assigneePubkey] as const,
  creator: (creatorPubkey: string) => [...bountyKeys.all, "creator", creatorPubkey] as const,
};

export function useGetBounties(
  filters?: BountyFilters,
  pagination?: PaginationParams,
  sort?: BountySortParams
) {
  return useQuery({
    queryKey: bountyKeys.list(filters, pagination, sort),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.status) params.append("status", filters.status);
      if (filters?.workspaceId) params.append("workspaceId", filters.workspaceId);
      if (filters?.assigneePubkey) params.append("assigneePubkey", filters.assigneePubkey);
      if (filters?.creatorPubkey) params.append("creatorPubkey", filters.creatorPubkey);
      if (filters?.search) params.append("search", filters.search);

      if (pagination?.page) params.append("page", pagination.page.toString());
      if (pagination?.pageSize) params.append("pageSize", pagination.pageSize.toString());

      if (sort?.sortBy) params.append("sortBy", sort.sortBy);
      if (sort?.sortOrder) params.append("sortOrder", sort.sortOrder);

      const response = await fetch(`/api/bounties?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch bounties");
      }

      const result = await response.json();
      return result;
    },
  });
}

export function useGetBounty(id: string, enabled = true) {
  return useQuery({
    queryKey: bountyKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/bounties/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch bounty");
      }

      const result = await response.json();
      return result.data;
    },
    enabled: enabled && !!id,
  });
}

export function useGetBountiesByWorkspace(
  workspaceId: string,
  pagination?: PaginationParams,
  sort?: BountySortParams
) {
  return useQuery({
    queryKey: bountyKeys.workspace(workspaceId),
    queryFn: () => bountyQueries.getByWorkspaceId(workspaceId, pagination, sort),
    enabled: !!workspaceId,
  });
}

export function useGetBountiesByAssignee(
  assigneePubkey: string,
  pagination?: PaginationParams,
  sort?: BountySortParams
) {
  return useQuery({
    queryKey: bountyKeys.assignee(assigneePubkey),
    queryFn: () => bountyQueries.getByAssigneePubkey(assigneePubkey, pagination, sort),
    enabled: !!assigneePubkey,
  });
}

export function useGetBountiesByCreator(
  creatorPubkey: string,
  pagination?: PaginationParams,
  sort?: BountySortParams
) {
  return useQuery({
    queryKey: bountyKeys.creator(creatorPubkey),
    queryFn: () => bountyQueries.getByCreatorPubkey(creatorPubkey, pagination, sort),
    enabled: !!creatorPubkey,
  });
}

export function useGetBountyProofs(bountyId: string) {
  return useQuery({
    queryKey: bountyKeys.proofs(bountyId),
    queryFn: () => bountyQueries.getProofsByBountyId(bountyId),
    enabled: !!bountyId,
  });
}

export function useGetProof(proofId: string, enabled = true) {
  return useQuery({
    queryKey: bountyKeys.proof(proofId),
    queryFn: () => bountyQueries.getProofById(proofId),
    enabled: enabled && !!proofId,
  });
}

export function useCreateBounty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createBountyAction(formData);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: bountyKeys.lists() });

      if (data?.workspaceId) {
        queryClient.invalidateQueries({ queryKey: bountyKeys.workspace(data.workspaceId) });
      }

      showSuccess("Bounty created successfully");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to create bounty");
    },
  });
}

export function useUpdateBounty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const result = await updateBountyAction(id, formData);
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: bountyKeys.detail(variables.id) });

      queryClient.invalidateQueries({ queryKey: bountyKeys.lists() });

      if (data?.workspaceId) {
        queryClient.invalidateQueries({ queryKey: bountyKeys.workspace(data.workspaceId) });
      }

      showSuccess("Bounty updated successfully");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to update bounty");
    },
  });
}

export function useAssignBounty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bountyId,
      assigneePubkey,
    }: {
      bountyId: string;
      assigneePubkey: string;
    }) => {
      const result = await assignBountyAction(bountyId, assigneePubkey);
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: bountyKeys.detail(variables.bountyId) });

      queryClient.invalidateQueries({ queryKey: bountyKeys.lists() });

      queryClient.invalidateQueries({ queryKey: bountyKeys.assignee(variables.assigneePubkey) });

      showSuccess("Bounty assigned successfully");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to assign bounty");
    },
  });
}

export function useSubmitProof() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bountyId, formData }: { bountyId: string; formData: FormData }) => {
      const result = await submitProofAction(bountyId, formData);
      return result.data;
    },
    onSuccess: (data) => {
      if (data?.bountyId) {
        queryClient.invalidateQueries({ queryKey: bountyKeys.detail(data.bountyId) });
        queryClient.invalidateQueries({ queryKey: bountyKeys.proofs(data.bountyId) });
      }

      showSuccess("Proof submitted successfully");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to submit proof");
    },
  });
}

export function useReviewProof() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ proofId, formData }: { proofId: string; formData: FormData }) => {
      const result = await reviewProofAction(proofId, formData);
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: bountyKeys.proof(variables.proofId) });

      if (data?.bountyId) {
        queryClient.invalidateQueries({ queryKey: bountyKeys.detail(data.bountyId) });
        queryClient.invalidateQueries({ queryKey: bountyKeys.proofs(data.bountyId) });
      }

      queryClient.invalidateQueries({ queryKey: bountyKeys.lists() });

      showSuccess("Proof reviewed successfully");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to review proof");
    },
  });
}
