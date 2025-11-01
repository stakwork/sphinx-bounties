import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userClient } from "@/lib/api/user-client";
import { apiFetch } from "@/lib/api/api-fetch";
import { API_ROUTES } from "@/constants/api";
import type { UserFilters, UserSortParams } from "@/types/filters";
import type { PaginationParams } from "@/types";
import {
  createUserAction,
  updateSocialLinksAction,
  updateNotificationSettingsAction,
  deleteUserAction,
  verifyGithubAction,
  verifyTwitterAction,
} from "@/actions";
import { showSuccess, showError } from "@/lib/toast";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters?: UserFilters, pagination?: PaginationParams, sort?: UserSortParams) =>
    [...userKeys.lists(), { filters, pagination, sort }] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (pubkey: string) => [...userKeys.details(), pubkey] as const,
  detailByUsername: (username: string) => [...userKeys.details(), "username", username] as const,
  profile: (pubkey: string) => [...userKeys.all, "profile", pubkey] as const,
  githubVerified: () => [...userKeys.all, "github-verified"] as const,
  twitterVerified: () => [...userKeys.all, "twitter-verified"] as const,
  stats: (pubkey: string) => [...userKeys.all, "stats", pubkey] as const,
  assignedBounties: (
    pubkey: string,
    pagination?: PaginationParams,
    status?: string,
    active?: boolean
  ) => [...userKeys.all, "assigned-bounties", pubkey, { pagination, status, active }] as const,
  createdBounties: (pubkey: string, pagination?: PaginationParams, status?: string) =>
    [...userKeys.all, "created-bounties", pubkey, { pagination, status }] as const,
};

export function useGetUsers(
  filters?: UserFilters,
  pagination?: PaginationParams,
  sort?: UserSortParams
) {
  return useQuery({
    queryKey: userKeys.list(filters, pagination, sort),
    queryFn: () => userClient.getAll(filters, pagination, sort),
  });
}

export function useGetUser(pubkey: string, enabled = true) {
  return useQuery({
    queryKey: userKeys.detail(pubkey),
    queryFn: () => userClient.getByPubkey(pubkey),
    enabled: enabled && !!pubkey,
  });
}

export function useGetUserByUsername(username: string, enabled = true) {
  return useQuery({
    queryKey: userKeys.detailByUsername(username),
    queryFn: () => userClient.getByUsername(username),
    enabled: enabled && !!username,
  });
}

export function useGetUserProfile(pubkey: string, enabled = true) {
  return useQuery({
    queryKey: userKeys.profile(pubkey),
    queryFn: () => userClient.getProfileByPubkey(pubkey),
    enabled: enabled && !!pubkey,
  });
}

export function useSearchUsers(query: string, pagination?: PaginationParams) {
  return useQuery({
    queryKey: [...userKeys.lists(), "search", query, pagination],
    queryFn: () => userClient.search(query, pagination),
    enabled: !!query && query.length >= 2,
  });
}

export function useGetGithubVerifiedUsers(pagination?: PaginationParams) {
  return useQuery({
    queryKey: userKeys.githubVerified(),
    queryFn: () => userClient.getGithubVerified(pagination),
  });
}

export function useGetTwitterVerifiedUsers(pagination?: PaginationParams) {
  return useQuery({
    queryKey: userKeys.twitterVerified(),
    queryFn: () => userClient.getTwitterVerified(pagination),
  });
}

export function useCheckUsernameAvailability(username: string, excludePubkey?: string) {
  return useQuery({
    queryKey: [...userKeys.all, "username-available", username, excludePubkey],
    queryFn: () => userClient.isUsernameAvailable(username, excludePubkey),
    enabled: !!username && username.length >= 3,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await createUserAction(formData);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      queryClient.invalidateQueries({ queryKey: [...userKeys.all, "username-available"] });

      showSuccess("User created successfully");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to create user");
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pubkey,
      data,
    }: {
      pubkey: string;
      data: {
        username?: string;
        alias?: string;
        description?: string;
        avatarUrl?: string;
        contactKey?: string;
        routeHint?: string;
        githubUsername?: string;
        twitterUsername?: string;
      };
    }) => {
      const response = await apiFetch(API_ROUTES.USERS.BY_ID(pubkey), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.pubkey) });
      queryClient.invalidateQueries({ queryKey: userKeys.profile(variables.pubkey) });

      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      if (data?.username) {
        queryClient.invalidateQueries({ queryKey: userKeys.detailByUsername(data.username) });
      }

      showSuccess("Profile updated successfully");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to update profile");
    },
  });
}

export function useUpdateSocialLinks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pubkey, formData }: { pubkey: string; formData: FormData }) => {
      const result = await updateSocialLinksAction(pubkey, formData);
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.pubkey) });
      queryClient.invalidateQueries({ queryKey: userKeys.profile(variables.pubkey) });

      queryClient.invalidateQueries({ queryKey: userKeys.githubVerified() });
      queryClient.invalidateQueries({ queryKey: userKeys.twitterVerified() });

      showSuccess("Social links updated successfully");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to update social links");
    },
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pubkey: string) => {
      const result = await updateNotificationSettingsAction(pubkey);
      return result.data;
    },
    onSuccess: (data, pubkey) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(pubkey) });
      queryClient.invalidateQueries({ queryKey: userKeys.profile(pubkey) });

      showSuccess("Notification settings updated successfully");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to update notification settings");
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pubkey, formData }: { pubkey: string; formData: FormData }) => {
      const result = await deleteUserAction(pubkey, formData);
      return result.data;
    },
    onSuccess: (_, variables) => {
      const pubkey = variables.pubkey;

      queryClient.removeQueries({ queryKey: userKeys.detail(pubkey) });
      queryClient.removeQueries({ queryKey: userKeys.profile(pubkey) });

      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      queryClient.invalidateQueries({ queryKey: userKeys.githubVerified() });
      queryClient.invalidateQueries({ queryKey: userKeys.twitterVerified() });

      showSuccess("User account deleted successfully");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to delete user account");
    },
  });
}

export function useVerifyGithub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pubkey, code }: { pubkey: string; code: string }) => {
      const formData = new FormData();
      formData.append("code", code);
      const result = await verifyGithubAction(pubkey, formData);
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.pubkey) });
      queryClient.invalidateQueries({ queryKey: userKeys.profile(variables.pubkey) });

      queryClient.invalidateQueries({ queryKey: userKeys.githubVerified() });

      showSuccess("GitHub account verified successfully");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to verify GitHub account");
    },
  });
}

export function useVerifyTwitter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pubkey, code }: { pubkey: string; code: string }) => {
      const formData = new FormData();
      formData.append("code", code);
      const result = await verifyTwitterAction(pubkey, formData);
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.pubkey) });
      queryClient.invalidateQueries({ queryKey: userKeys.profile(variables.pubkey) });
      queryClient.invalidateQueries({ queryKey: userKeys.twitterVerified() });

      showSuccess("Twitter account verified successfully");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to verify Twitter account");
    },
  });
}

export function useGetUserStats(pubkey: string, enabled = true) {
  return useQuery({
    queryKey: userKeys.stats(pubkey),
    queryFn: () => userClient.getStats(pubkey),
    enabled: enabled && !!pubkey,
  });
}

export function useGetUserAssignedBounties(
  pubkey: string,
  pagination?: PaginationParams,
  status?: string,
  active?: boolean
) {
  return useQuery({
    queryKey: userKeys.assignedBounties(pubkey, pagination, status, active),
    queryFn: () => userClient.getAssignedBounties(pubkey, pagination, status, active),
    enabled: !!pubkey,
  });
}

export function useGetUserCreatedBounties(
  pubkey: string,
  pagination?: PaginationParams,
  status?: string
) {
  return useQuery({
    queryKey: userKeys.createdBounties(pubkey, pagination, status),
    queryFn: () => userClient.getCreatedBounties(pubkey, pagination, status),
    enabled: !!pubkey,
  });
}
