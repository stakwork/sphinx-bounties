"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, Trash2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from "@/hooks/queries/use-notification-queries";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [filterUnread, setFilterUnread] = useState<boolean | undefined>(undefined);
  const [filterType, setFilterType] = useState<string | undefined>(undefined);

  const { data: response, isLoading } = useGetNotifications(
    { page, pageSize: 20 },
    filterUnread,
    filterType
  );
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = (response?.data || []) as Notification[];
  const pagination = response?.meta?.pagination;
  const hasUnread = notifications.some((n) => !n.read);

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead.mutate(notificationId);
  };

  const handleDelete = (notificationId: string) => {
    deleteNotification.mutate(notificationId);
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.relatedEntityType === "BOUNTY" && notification.relatedEntityId) {
      return `/bounties/${notification.relatedEntityId}`;
    }
    if (notification.relatedEntityType === "WORKSPACE" && notification.relatedEntityId) {
      return `/workspaces/${notification.relatedEntityId}`;
    }
    return null;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getNotificationTypeLabel = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            {hasUnread && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4 mt-4">
            <Select
              value={filterUnread === undefined ? "all" : filterUnread ? "unread" : "read"}
              onValueChange={(value) => {
                setFilterUnread(value === "all" ? undefined : value === "unread");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread only</SelectItem>
                <SelectItem value="read">Read only</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterType || "all"}
              onValueChange={(value) => {
                setFilterType(value === "all" ? undefined : value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="BOUNTY_CREATED">Bounty created</SelectItem>
                <SelectItem value="BOUNTY_UPDATED">Bounty updated</SelectItem>
                <SelectItem value="BOUNTY_COMPLETED">Bounty completed</SelectItem>
                <SelectItem value="BOUNTY_CANCELLED">Bounty cancelled</SelectItem>
                <SelectItem value="SUBMISSION_CREATED">Submission created</SelectItem>
                <SelectItem value="SUBMISSION_APPROVED">Submission approved</SelectItem>
                <SelectItem value="SUBMISSION_REJECTED">Submission rejected</SelectItem>
                <SelectItem value="COMMENT_CREATED">Comment created</SelectItem>
                <SelectItem value="WORKSPACE_INVITATION">Workspace invitation</SelectItem>
                <SelectItem value="WORKSPACE_MEMBER_JOINED">Member joined</SelectItem>
                <SelectItem value="WORKSPACE_MEMBER_LEFT">Member left</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading && (
            <div className="space-y-2 p-6">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="text-center py-16">
              <Bell className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-sm text-neutral-600">
                {filterUnread
                  ? "You have no unread notifications"
                  : "You don't have any notifications yet"}
              </p>
            </div>
          )}

          {!isLoading && notifications.length > 0 && (
            <div className="divide-y divide-neutral-200">
              {notifications.map((notification) => {
                const notificationLink = getNotificationLink(notification);
                const content = (
                  <div
                    className={cn(
                      "p-6 transition-colors",
                      notificationLink && "hover:bg-neutral-50 cursor-pointer",
                      !notification.read && "bg-primary-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {!notification.read && (
                            <div className="h-2.5 w-2.5 rounded-full bg-primary-500 flex-shrink-0" />
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-base">{notification.title}</h4>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700">
                              {getNotificationTypeLabel(notification.type)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-neutral-700 mb-2">{notification.message}</p>
                        <p className="text-xs text-neutral-500">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(notification.id);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );

                return notificationLink ? (
                  <Link
                    key={notification.id}
                    href={notificationLink}
                    onClick={() => {
                      if (!notification.read) {
                        handleMarkAsRead(notification.id);
                      }
                    }}
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={notification.id}>{content}</div>
                );
              })}
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-6 border-t border-neutral-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-neutral-600">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
