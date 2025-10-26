import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceClient } from "@/lib/api/workspace-client";
import type { WorkspaceFilters, WorkspaceSortParams } from "@/types/filters";
import type { PaginationParams } from "@/types";
import {
  createWorkspaceAction,
  updateWorkspaceAction,
  deleteWorkspaceAction,
  addMemberAction,
  updateMemberRoleAction,
  removeMemberAction,
} from "@/actions";
import { showSuccess, showError } from "@/lib/toast";

export const workspaceKeys = {
  all: ["workspaces"] as const,
  lists: () => [...workspaceKeys.all, "list"] as const,
  list: (filters?: WorkspaceFilters, pagination?: PaginationParams, sort?: WorkspaceSortParams) =>
    [...workspaceKeys.lists(), { filters, pagination, sort }] as const,
  details: () => [...workspaceKeys.all, "detail"] as const,
  detail: (id: string) => [...workspaceKeys.details(), id] as const,
  members: (workspaceId: string) => [...workspaceKeys.all, "members", workspaceId] as const,
  budget: (workspaceId: string) => [...workspaceKeys.all, "budget", workspaceId] as const,
  owner: (ownerPubkey: string) => [...workspaceKeys.all, "owner", ownerPubkey] as const,
  member: (memberPubkey: string) => [...workspaceKeys.all, "member", memberPubkey] as const,
  userRole: (workspaceId: string, userPubkey: string) =>
    [...workspaceKeys.all, "role", workspaceId, userPubkey] as const,
};

export function useGetWorkspaces(
  filters?: WorkspaceFilters,
  pagination?: PaginationParams,
  sort?: WorkspaceSortParams
) {
  return useQuery({
    queryKey: workspaceKeys.list(filters, pagination, sort),
    queryFn: () => workspaceClient.getAll(filters, pagination, sort),
  });
}

export function useGetWorkspace(id: string, enabled = true) {
  return useQuery({
    queryKey: workspaceKeys.detail(id),
    queryFn: () => workspaceClient.getById(id),
    enabled: enabled && !!id,
  });
}

export function useGetWorkspacesByOwner(
  ownerPubkey: string,
  pagination?: PaginationParams,
  sort?: WorkspaceSortParams
) {
  return useQuery({
    queryKey: workspaceKeys.owner(ownerPubkey),
    queryFn: () => workspaceClient.getByOwnerPubkey(ownerPubkey, pagination, sort),
    enabled: !!ownerPubkey,
  });
}

export function useGetWorkspacesByMember(
  memberPubkey: string,
  pagination?: PaginationParams,
  sort?: WorkspaceSortParams
) {
  return useQuery({
    queryKey: workspaceKeys.member(memberPubkey),
    queryFn: () => workspaceClient.getByMemberPubkey(memberPubkey, pagination, sort),
    enabled: !!memberPubkey,
  });
}

export function useGetWorkspaceMembers(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.members(workspaceId),
    queryFn: () => workspaceClient.getMembersByWorkspaceId(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useGetUserRole(workspaceId: string, userPubkey: string) {
  return useQuery({
    queryKey: workspaceKeys.userRole(workspaceId, userPubkey),
    queryFn: () => workspaceClient.getUserRole(workspaceId, userPubkey),
    enabled: !!workspaceId && !!userPubkey,
  });
}

export function useGetWorkspaceBudget(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.budget(workspaceId),
    queryFn: () => workspaceClient.getBudget(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useGetWorkspaceTransactions(
  workspaceId: string,
  pagination?: PaginationParams,
  type?: string
) {
  return useQuery({
    queryKey: [...workspaceKeys.all, "transactions", workspaceId, { pagination, type }] as const,
    queryFn: () => workspaceClient.getTransactions(workspaceId, pagination, type),
    enabled: !!workspaceId,
  });
}

export function useGetWorkspaceActivities(
  workspaceId: string,
  pagination?: PaginationParams,
  action?: string
) {
  return useQuery({
    queryKey: [...workspaceKeys.all, "activities", workspaceId, { pagination, action }] as const,
    queryFn: () => workspaceClient.getActivities(workspaceId, pagination, action),
    enabled: !!workspaceId,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createWorkspaceAction(formData);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });

      if (data?.ownerPubkey) {
        queryClient.invalidateQueries({ queryKey: workspaceKeys.owner(data.ownerPubkey) });
      }

      showSuccess("Workspace created successfully");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to create workspace");
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const result = await updateWorkspaceAction(id, formData);
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(variables.id) });

      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });

      if (data?.ownerPubkey) {
        queryClient.invalidateQueries({ queryKey: workspaceKeys.owner(data.ownerPubkey) });
      }

      showSuccess("Workspace updated successfully");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to update workspace");
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workspaceId: string) => {
      const result = await deleteWorkspaceAction(workspaceId);
      return result.data;
    },
    onSuccess: (_, workspaceId) => {
      queryClient.removeQueries({ queryKey: workspaceKeys.detail(workspaceId) });

      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });

      queryClient.invalidateQueries({ queryKey: [...workspaceKeys.all, "owner"] });
      queryClient.invalidateQueries({ queryKey: [...workspaceKeys.all, "member"] });

      showSuccess("Workspace deleted successfully");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to delete workspace");
    },
  });
}

export function useAddMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, formData }: { workspaceId: string; formData: FormData }) => {
      const result = await addMemberAction(workspaceId, formData);
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(variables.workspaceId) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(variables.workspaceId) });

      const userPubkey = variables.formData.get("userPubkey") as string;
      if (userPubkey) {
        queryClient.invalidateQueries({ queryKey: workspaceKeys.member(userPubkey) });
      }

      showSuccess("Member added successfully");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to add member");
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      memberId,
      formData,
    }: {
      workspaceId: string;
      memberId: string;
      formData: FormData;
    }) => {
      const result = await updateMemberRoleAction(workspaceId, memberId, formData);
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(variables.workspaceId) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(variables.workspaceId) });

      showSuccess("Member role updated successfully");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to update member role");
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      memberId,
    }: {
      workspaceId: string;
      memberId: string;
      userPubkey?: string;
    }) => {
      const result = await removeMemberAction(workspaceId, memberId);
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(variables.workspaceId) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(variables.workspaceId) });

      if (variables.userPubkey) {
        queryClient.invalidateQueries({ queryKey: workspaceKeys.member(variables.userPubkey) });
      }

      showSuccess("Member removed successfully");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to remove member");
    },
  });
}
