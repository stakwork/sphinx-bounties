/**
 * Notification Endpoints Integration Tests
 *
 * Tests for notification management endpoints:
 * - GET /api/notifications - List user notifications with filtering
 * - PATCH /api/notifications - Mark all notifications as read
 * - PATCH /api/notifications/[id] - Mark single notification as read
 * - DELETE /api/notifications/[id] - Delete single notification
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { NotificationType } from "@prisma/client";
import { GET as GetNotifications, PATCH as MarkAllRead } from "@/app/api/notifications/route";
import {
  PATCH as MarkRead,
  DELETE as DeleteNotification,
} from "@/app/api/notifications/[id]/route";

// Helper to create authenticated request
function createRequest(url: string, method: string, userPubkey?: string, body?: any) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (userPubkey) {
    headers["x-user-pubkey"] = userPubkey;
  }
  return new Request(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  }) as any;
}

// Helper to parse response
async function parseResponse(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

describe("Notification Endpoints", () => {
  let testUser1: { pubkey: string; username: string };
  let testUser2: { pubkey: string; username: string };
  let notification1Id: string;
  let notification2Id: string;
  let notification3Id: string;

  beforeAll(async () => {
    // Cleanup
    await db.notification.deleteMany({
      where: {
        userPubkey: {
          in: ["notif-user1-pubkey", "notif-user2-pubkey"],
        },
      },
    });
    await db.user.deleteMany({
      where: {
        username: {
          in: ["notif-test-user1", "notif-test-user2"],
        },
      },
    });

    // Create test users
    testUser1 = await db.user.create({
      data: {
        pubkey: "notif-user1-pubkey",
        username: "notif-test-user1",
      },
    });

    testUser2 = await db.user.create({
      data: {
        pubkey: "notif-user2-pubkey",
        username: "notif-test-user2",
      },
    });

    // Create test notifications
    const notif1 = await db.notification.create({
      data: {
        userPubkey: testUser1.pubkey,
        type: NotificationType.WORKSPACE_INVITE,
        title: "Workspace Invitation",
        message: "You have been invited to a workspace",
        read: false,
        relatedEntityType: "WORKSPACE",
        relatedEntityId: "workspace-1",
      },
    });
    notification1Id = notif1.id;

    const notif2 = await db.notification.create({
      data: {
        userPubkey: testUser1.pubkey,
        type: NotificationType.BOUNTY_ASSIGNED,
        title: "Bounty Assigned",
        message: "A bounty has been assigned to you",
        read: true,
        relatedEntityType: "BOUNTY",
        relatedEntityId: "bounty-1",
      },
    });
    notification2Id = notif2.id;

    const notif3 = await db.notification.create({
      data: {
        userPubkey: testUser2.pubkey,
        type: NotificationType.PAYMENT_RECEIVED,
        title: "Payment Received",
        message: "You have received a payment",
        read: false,
        relatedEntityType: "BOUNTY",
        relatedEntityId: "bounty-2",
      },
    });
    notification3Id = notif3.id;
  });

  afterAll(async () => {
    await db.notification.deleteMany({
      where: {
        userPubkey: {
          in: ["notif-user1-pubkey", "notif-user2-pubkey"],
        },
      },
    });
    await db.user.deleteMany({
      where: {
        pubkey: {
          in: ["notif-user1-pubkey", "notif-user2-pubkey"],
        },
      },
    });
  });

  describe("GET /api/notifications", () => {
    it("should list user notifications with pagination", async () => {
      const request = createRequest(
        "http://localhost/api/notifications?page=1&limit=10",
        "GET",
        testUser1.pubkey
      );
      const response = await GetNotifications(request);

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
      expect(data.meta.pagination).toBeDefined();
      expect(data.meta.pagination.page).toBe(1);
    });

    it("should include notification details", async () => {
      const request = createRequest("http://localhost/api/notifications", "GET", testUser1.pubkey);
      const response = await GetNotifications(request);

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.data.length).toBeGreaterThan(0);
      const notification = data.data[0];
      expect(notification).toHaveProperty("id");
      expect(notification).toHaveProperty("type");
      expect(notification).toHaveProperty("title");
      expect(notification).toHaveProperty("message");
      expect(notification).toHaveProperty("read");
    });

    it("should filter by unread only", async () => {
      const request = createRequest(
        "http://localhost/api/notifications?unreadOnly=true",
        "GET",
        testUser1.pubkey
      );
      const response = await GetNotifications(request);

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);
      data.data.forEach((notif: any) => {
        expect(notif.read).toBe(false);
      });
    });

    it("should filter by notification type", async () => {
      const request = createRequest(
        `http://localhost/api/notifications?type=${NotificationType.WORKSPACE_INVITE}`,
        "GET",
        testUser1.pubkey
      );
      const response = await GetNotifications(request);

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);
      data.data.forEach((notif: any) => {
        expect(notif.type).toBe(NotificationType.WORKSPACE_INVITE);
      });
    });

    it("should only show user own notifications", async () => {
      const request = createRequest("http://localhost/api/notifications", "GET", testUser1.pubkey);
      const response = await GetNotifications(request);

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      data.data.forEach((notification: any) => {
        expect(notification.id).not.toBe(notification3Id); // User2's notification
      });
    });

    it("should require authentication", async () => {
      const request = createRequest("http://localhost/api/notifications", "GET");
      const response = await GetNotifications(request);

      expect(response.status).toBe(401);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should reject invalid page parameter", async () => {
      const request = createRequest(
        "http://localhost/api/notifications?page=-1",
        "GET",
        testUser1.pubkey
      );
      const response = await GetNotifications(request);

      expect(response.status).toBe(422);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should reject limit exceeding max", async () => {
      const request = createRequest(
        "http://localhost/api/notifications?limit=150",
        "GET",
        testUser1.pubkey
      );
      const response = await GetNotifications(request);

      expect(response.status).toBe(422);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });
  });

  describe("PATCH /api/notifications (mark all as read)", () => {
    it("should mark all unread notifications as read", async () => {
      const request = createRequest(
        "http://localhost/api/notifications",
        "PATCH",
        testUser1.pubkey
      );
      const response = await MarkAllRead(request);

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("count");
      expect(typeof data.data.count).toBe("number");
    });

    it("should return count of 0 if no unread notifications", async () => {
      // Mark all as read first
      await db.notification.updateMany({
        where: { userPubkey: testUser2.pubkey },
        data: { read: true },
      });

      const request = createRequest(
        "http://localhost/api/notifications",
        "PATCH",
        testUser2.pubkey
      );
      const response = await MarkAllRead(request);

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.data.count).toBe(0);
    });

    it("should only affect authenticated user notifications", async () => {
      // Set user1 notification to unread
      await db.notification.update({
        where: { id: notification1Id },
        data: { read: false },
      });

      // Mark user2's notifications as read
      const request = createRequest(
        "http://localhost/api/notifications",
        "PATCH",
        testUser2.pubkey
      );
      await MarkAllRead(request);

      // Verify user1's notification is still unread
      const user1Notif = await db.notification.findUnique({
        where: { id: notification1Id },
      });
      expect(user1Notif?.read).toBe(false);
    });

    it("should require authentication", async () => {
      const request = createRequest("http://localhost/api/notifications", "PATCH");
      const response = await MarkAllRead(request);

      expect(response.status).toBe(401);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });
  });

  describe("PATCH /api/notifications/[id] (mark single as read)", () => {
    it("should mark single notification as read", async () => {
      // Set to unread first
      await db.notification.update({
        where: { id: notification1Id },
        data: { read: false },
      });

      const request = createRequest(
        `http://localhost/api/notifications/${notification1Id}`,
        "PATCH",
        testUser1.pubkey
      );
      const response = await MarkRead(request, {
        params: Promise.resolve({ id: notification1Id }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);

      // Verify in database
      const updatedNotif = await db.notification.findUnique({
        where: { id: notification1Id },
      });
      expect(updatedNotif?.read).toBe(true);
    });

    it("should work even if already read", async () => {
      // Set to read first
      await db.notification.update({
        where: { id: notification2Id },
        data: { read: true },
      });

      const request = createRequest(
        `http://localhost/api/notifications/${notification2Id}`,
        "PATCH",
        testUser1.pubkey
      );
      const response = await MarkRead(request, {
        params: Promise.resolve({ id: notification2Id }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);
    });

    it("should require authentication", async () => {
      const request = createRequest(
        `http://localhost/api/notifications/${notification1Id}`,
        "PATCH"
      );
      const response = await MarkRead(request, {
        params: Promise.resolve({ id: notification1Id }),
      });

      expect(response.status).toBe(401);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should reject if user is not notification owner", async () => {
      const request = createRequest(
        `http://localhost/api/notifications/${notification1Id}`,
        "PATCH",
        testUser2.pubkey // Different user
      );
      const response = await MarkRead(request, {
        params: Promise.resolve({ id: notification1Id }),
      });

      expect(response.status).toBe(403);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should return 404 for non-existent notification", async () => {
      const fakeId = "non-existent-notification-id";
      const request = createRequest(
        `http://localhost/api/notifications/${fakeId}`,
        "PATCH",
        testUser1.pubkey
      );
      const response = await MarkRead(request, {
        params: Promise.resolve({ id: fakeId }),
      });

      expect(response.status).toBe(404);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });
  });

  describe("DELETE /api/notifications/[id]", () => {
    it("should delete own notification", async () => {
      // Create a notification to delete
      const notif = await db.notification.create({
        data: {
          userPubkey: testUser1.pubkey,
          type: NotificationType.BOUNTY_COMPLETED,
          title: "Test Notification",
          message: "Test message",
          read: false,
        },
      });

      const request = createRequest(
        `http://localhost/api/notifications/${notif.id}`,
        "DELETE",
        testUser1.pubkey
      );
      const response = await DeleteNotification(request, {
        params: Promise.resolve({ id: notif.id }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);

      // Verify deleted
      const deleted = await db.notification.findUnique({
        where: { id: notif.id },
      });
      expect(deleted).toBeNull();
    });

    it("should require authentication", async () => {
      const request = createRequest(
        `http://localhost/api/notifications/${notification1Id}`,
        "DELETE"
      );
      const response = await DeleteNotification(request, {
        params: Promise.resolve({ id: notification1Id }),
      });

      expect(response.status).toBe(401);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should reject if user is not notification owner", async () => {
      const request = createRequest(
        `http://localhost/api/notifications/${notification1Id}`,
        "DELETE",
        testUser2.pubkey // Different user
      );
      const response = await DeleteNotification(request, {
        params: Promise.resolve({ id: notification1Id }),
      });

      expect(response.status).toBe(403);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should return 404 for non-existent notification", async () => {
      const fakeId = "non-existent-notification-id";
      const request = createRequest(
        `http://localhost/api/notifications/${fakeId}`,
        "DELETE",
        testUser1.pubkey
      );
      const response = await DeleteNotification(request, {
        params: Promise.resolve({ id: fakeId }),
      });

      expect(response.status).toBe(404);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should not allow deleting other users notifications", async () => {
      const request = createRequest(
        `http://localhost/api/notifications/${notification3Id}`,
        "DELETE",
        testUser1.pubkey // User1 trying to delete User2's notification
      );
      const response = await DeleteNotification(request, {
        params: Promise.resolve({ id: notification3Id }),
      });

      expect(response.status).toBe(403);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);

      // Verify not deleted
      const notif = await db.notification.findUnique({
        where: { id: notification3Id },
      });
      expect(notif).not.toBeNull();
    });
  });
});
