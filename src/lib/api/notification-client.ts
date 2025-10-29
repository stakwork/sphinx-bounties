import type { PaginationParams } from "@/types";
import { apiFetch } from "@/lib/api/api-fetch";
import { API_ROUTES } from "@/constants/api";

export const notificationClient = {
  async getAll(pagination?: PaginationParams, unreadOnly?: boolean, type?: string) {
    const params = new URLSearchParams();
    if (pagination?.page) params.append("page", pagination.page.toString());
    if (pagination?.pageSize) params.append("limit", pagination.pageSize.toString());
    if (unreadOnly) params.append("unreadOnly", "true");
    if (type) params.append("type", type);

    const response = await apiFetch(`${API_ROUTES.NOTIFICATIONS.BASE}?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch notifications");
    }

    const result = await response.json();
    return result;
  },

  async markAsRead(notificationId: string) {
    const response = await apiFetch(API_ROUTES.NOTIFICATIONS.BY_ID(notificationId), {
      method: "PATCH",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to mark notification as read");
    }

    return response.json();
  },

  async markAllAsRead() {
    const response = await apiFetch(API_ROUTES.NOTIFICATIONS.READ_ALL, {
      method: "PATCH",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to mark all as read");
    }

    return response.json();
  },

  async delete(notificationId: string) {
    const response = await apiFetch(API_ROUTES.NOTIFICATIONS.BY_ID(notificationId), {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to delete notification");
    }

    return response.json();
  },
};
