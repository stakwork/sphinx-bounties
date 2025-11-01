import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationClient } from "@/lib/api/notification-client";
import type { PaginationParams } from "@/types";
import { showSuccess, showError } from "@/lib/toast";

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (pagination?: PaginationParams, unreadOnly?: boolean, type?: string) =>
    [...notificationKeys.lists(), { pagination, unreadOnly, type }] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

export function useGetNotifications(
  pagination?: PaginationParams,
  unreadOnly?: boolean,
  type?: string
) {
  return useQuery({
    queryKey: notificationKeys.list(pagination, unreadOnly, type),
    queryFn: () => notificationClient.getAll(pagination, unreadOnly, type),
  });
}

export function useGetUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const result = await notificationClient.getAll({ page: 1, pageSize: 1 }, true);
      return result.meta?.pagination?.totalCount || 0;
    },
    refetchInterval: 30000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationClient.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to mark notification as read");
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationClient.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      showSuccess("All notifications marked as read");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to mark all as read");
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationClient.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      showSuccess("Notification deleted");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to delete notification");
    },
  });
}
