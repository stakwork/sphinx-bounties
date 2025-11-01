/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { BountyStatus } from "@prisma/client";
import {
  createAuthedRequest,
  createTestUser,
  createTestWorkspace,
  createTestBounty,
  cleanupTestUsers,
  connectTestDb,
  disconnectTestDb,
  generateTestPubkey,
  parseResponse,
  addWorkspaceMember,
} from "../utils";
import { GET as GetTiming, DELETE as DeleteTiming } from "@/app/api/bounties/[id]/timing/route";
import { PUT as StartTiming } from "@/app/api/bounties/[id]/timing/start/route";
import { PUT as CloseTiming } from "@/app/api/bounties/[id]/timing/close/route";

describe("Bounty Timing Integration Tests", () => {
  const ownerPubkey = generateTestPubkey("owner");
  const assigneePubkey = generateTestPubkey("assignee");
  const otherPubkey = generateTestPubkey("other");

  let workspaceId: string;
  let bountyId: string;

  beforeAll(async () => {
    await connectTestDb();

    // Clean up any leftover users from previous failed runs (by username)
    try {
      const existingUsers = await db.user.findMany({
        where: {
          username: { in: ["timing_owner", "timing_assignee", "timing_other"] },
        },
        select: { pubkey: true },
      });
      if (existingUsers.length > 0) {
        await cleanupTestUsers(existingUsers.map((u) => u.pubkey));
      }
    } catch (_e) {
      // Ignore errors if users don't exist
    }

    await createTestUser({ pubkey: ownerPubkey, username: "timing_owner" });
    await createTestUser({ pubkey: assigneePubkey, username: "timing_assignee" });
    await createTestUser({ pubkey: otherPubkey, username: "timing_other" });
  });

  afterAll(async () => {
    await cleanupTestUsers([ownerPubkey, assigneePubkey, otherPubkey]);
    await disconnectTestDb();
  });

  beforeEach(async () => {
    // Clean up previous test data (only from timing tests)
    await db.bountyComment.deleteMany({});
    await db.bountyActivity.deleteMany({});
    await db.bounty.deleteMany({
      where: {
        workspace: {
          name: { startsWith: "timing-test-ws-" },
        },
      },
    });
    await db.workspace.deleteMany({
      where: {
        name: { startsWith: "timing-test-ws-" },
      },
    });

    // Create fresh test data for each test
    const { workspace } = await createTestWorkspace({
      ownerPubkey,
      name: `timing-test-ws-${Date.now()}`,
      description: "Workspace for testing bounty timing",
    });
    workspaceId = workspace.id;

    // Add assignee as workspace member
    await addWorkspaceMember({
      workspaceId,
      userPubkey: assigneePubkey,
    });

    // Create bounty assigned to assignee
    const bounty = await createTestBounty({
      workspaceId,
      creatorPubkey: ownerPubkey,
      title: `Test Bounty ${Date.now()}`,
      description: "Test bounty description that is long enough to pass validation",
      deliverables: "Test deliverables description for bounty completion",
      amount: 50000,
      status: BountyStatus.ASSIGNED,
      assigneePubkey,
    });
    bountyId = bounty.id;
  });

  describe("GET /api/bounties/[id]/timing", () => {
    it("should get timing data when no timing set", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/timing`,
        assigneePubkey,
        { method: "GET" }
      );
      const response = await GetTiming(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);
      expect(data.data.bountyId).toBe(bountyId);
      expect(data.data.workStartedAt).toBeNull();
      expect(data.data.workClosedAt).toBeNull();
      expect(data.data.isActive).toBe(false);
    });

    it("should get timing data when work started", async () => {
      // Start work first
      const startTime = new Date();
      await db.bounty.update({
        where: { id: bountyId },
        data: { workStartedAt: startTime },
      });

      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/timing`,
        assigneePubkey,
        { method: "GET" }
      );
      const response = await GetTiming(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);
      expect(data.data.workStartedAt).toBeTruthy();
      expect(data.data.workClosedAt).toBeNull();
      expect(data.data.isActive).toBe(true);
    });

    it("should get timing data when work closed", async () => {
      // Start and close work
      const startTime = new Date(Date.now() - 3600000); // 1 hour ago
      const closeTime = new Date();
      await db.bounty.update({
        where: { id: bountyId },
        data: {
          workStartedAt: startTime,
          workClosedAt: closeTime,
        },
      });

      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/timing`,
        assigneePubkey,
        { method: "GET" }
      );
      const response = await GetTiming(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);
      expect(data.data.workStartedAt).toBeTruthy();
      expect(data.data.workClosedAt).toBeTruthy();
      expect(data.data.isActive).toBe(false);
    });

    it("should return 404 for non-existent bounty", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/non-existent-id/timing`,
        assigneePubkey,
        { method: "GET" }
      );
      const response = await GetTiming(request, {
        params: Promise.resolve({ id: "non-existent-id" }),
      });

      expect(response.status).toBe(404);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should return 403 for non-workspace-member", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/timing`,
        otherPubkey,
        { method: "GET" }
      );
      const response = await GetTiming(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(403);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should require authentication", async () => {
      const request = createAuthedRequest(`http://localhost/api/bounties/${bountyId}/timing`, "", {
        method: "GET",
      });
      const response = await GetTiming(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("PUT /api/bounties/[id]/timing/start", () => {
    it("should start timing as assignee", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/timing/start`,
        assigneePubkey,
        { method: "PUT" }
      );
      const response = await StartTiming(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);
      expect(data.data.bountyId).toBe(bountyId);
      expect(data.data.workStartedAt).toBeTruthy();

      // Verify in database
      const bounty = await db.bounty.findUnique({
        where: { id: bountyId },
        select: { workStartedAt: true, workClosedAt: true },
      });
      expect(bounty?.workStartedAt).toBeTruthy();
      expect(bounty?.workClosedAt).toBeNull();
    });

    it("should reject start when timing already active", async () => {
      // Start timing first
      await db.bounty.update({
        where: { id: bountyId },
        data: { workStartedAt: new Date() },
      });

      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/timing/start`,
        assigneePubkey,
        { method: "PUT" }
      );
      const response = await StartTiming(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(400);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should allow restarting after close", async () => {
      // Start and close first
      await db.bounty.update({
        where: { id: bountyId },
        data: {
          workStartedAt: new Date(Date.now() - 3600000),
          workClosedAt: new Date(),
        },
      });

      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/timing/start`,
        assigneePubkey,
        { method: "PUT" }
      );
      const response = await StartTiming(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);
    });

    it("should reject non-assignee", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/timing/start`,
        ownerPubkey,
        { method: "PUT" }
      );
      const response = await StartTiming(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(403);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should return 404 for non-existent bounty", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/non-existent-id/timing/start`,
        assigneePubkey,
        { method: "PUT" }
      );
      const response = await StartTiming(request, {
        params: Promise.resolve({ id: "non-existent-id" }),
      });

      expect(response.status).toBe(404);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should require authentication", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/timing/start`,
        "",
        { method: "PUT" }
      );
      const response = await StartTiming(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("PUT /api/bounties/[id]/timing/close", () => {
    beforeEach(async () => {
      // Start timing before each close test
      await db.bounty.update({
        where: { id: bountyId },
        data: {
          workStartedAt: new Date(Date.now() - 3600000), // 1 hour ago
          workClosedAt: null,
        },
      });
    });

    it("should close timing as assignee", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/timing/close`,
        assigneePubkey,
        { method: "PUT" }
      );
      const response = await CloseTiming(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);
      expect(data.data.bountyId).toBe(bountyId);
      expect(data.data.workStartedAt).toBeTruthy();
      expect(data.data.workClosedAt).toBeTruthy();
      expect(data.data.durationSeconds).toBeGreaterThan(0);

      // Verify in database
      const bounty = await db.bounty.findUnique({
        where: { id: bountyId },
        select: { workStartedAt: true, workClosedAt: true },
      });
      expect(bounty?.workStartedAt).toBeTruthy();
      expect(bounty?.workClosedAt).toBeTruthy();
    });

    it("should calculate duration correctly", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/timing/close`,
        assigneePubkey,
        { method: "PUT" }
      );
      const response = await CloseTiming(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.data.durationSeconds).toBeGreaterThanOrEqual(3600); // At least 1 hour
    });

    it("should reject close when timing not started", async () => {
      // Reset timing
      await db.bounty.update({
        where: { id: bountyId },
        data: {
          workStartedAt: null,
          workClosedAt: null,
        },
      });

      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/timing/close`,
        assigneePubkey,
        { method: "PUT" }
      );
      const response = await CloseTiming(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(400);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should reject close when already closed", async () => {
      // Close first time
      await db.bounty.update({
        where: { id: bountyId },
        data: { workClosedAt: new Date() },
      });

      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/timing/close`,
        assigneePubkey,
        { method: "PUT" }
      );
      const response = await CloseTiming(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(400);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should reject non-assignee", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/timing/close`,
        ownerPubkey,
        { method: "PUT" }
      );
      const response = await CloseTiming(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(403);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should return 404 for non-existent bounty", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/non-existent-id/timing/close`,
        assigneePubkey,
        { method: "PUT" }
      );
      const response = await CloseTiming(request, {
        params: Promise.resolve({ id: "non-existent-id" }),
      });

      expect(response.status).toBe(404);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should require authentication", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/timing/close`,
        "",
        { method: "PUT" }
      );
      const response = await CloseTiming(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /api/bounties/[id]/timing", () => {
    beforeEach(async () => {
      // Set timing data before each delete test
      await db.bounty.update({
        where: { id: bountyId },
        data: {
          workStartedAt: new Date(Date.now() - 7200000), // 2 hours ago
          workClosedAt: new Date(),
        },
      });
    });

    it("should delete timing data as assignee", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/timing`,
        assigneePubkey,
        { method: "DELETE" }
      );
      const response = await DeleteTiming(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);

      // Verify in database
      const bounty = await db.bounty.findUnique({
        where: { id: bountyId },
        select: { workStartedAt: true, workClosedAt: true },
      });
      expect(bounty?.workStartedAt).toBeNull();
      expect(bounty?.workClosedAt).toBeNull();
    });

    it("should reject non-assignee", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/timing`,
        ownerPubkey,
        { method: "DELETE" }
      );
      const response = await DeleteTiming(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(403);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should return 404 for non-existent bounty", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/non-existent-id/timing`,
        assigneePubkey,
        { method: "DELETE" }
      );
      const response = await DeleteTiming(request, {
        params: Promise.resolve({ id: "non-existent-id" }),
      });

      expect(response.status).toBe(404);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should require authentication", async () => {
      const request = createAuthedRequest(`http://localhost/api/bounties/${bountyId}/timing`, "", {
        method: "DELETE",
      });
      const response = await DeleteTiming(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(401);
    });
  });
});
