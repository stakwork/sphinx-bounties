/**
 * Final Endpoints Integration Tests
 *
 * Tests for remaining endpoints:
 * - GET /api/leaderboard - Public leaderboard of top bounty hunters
 * - GET /api/workspaces/[id]/activities - Workspace activity log (member-only)
 * - GET /api/admin/workspaces/[id]/stats - Admin workspace statistics (admin/owner-only)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { BountyStatus, WorkspaceRole, WorkspaceActivityAction } from "@prisma/client";
import { GET as GetLeaderboard } from "@/app/api/leaderboard/route";
import { GET as GetActivities } from "@/app/api/workspaces/[id]/activities/route";
import { GET as GetAdminStats } from "@/app/api/admin/workspaces/[id]/stats/route";

// Helper to create request
function createRequest(url: string, userPubkey?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (userPubkey) {
    headers["x-user-pubkey"] = userPubkey;
  }
  return new Request(url, {
    method: "GET",
    headers,
  }) as any;
}

// Helper to parse response
async function parseResponse(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

describe("Final Endpoints", () => {
  let testWorkspace: { id: string; name: string };
  let ownerUser: { pubkey: string; username: string };
  let hunterUser: { pubkey: string; username: string };
  let contributorUser: { pubkey: string; username: string };
  let bounty1Id: string;
  let bounty2Id: string;
  let bounty3Id: string;
  let bounty4Id: string;

  beforeAll(async () => {
    // Cleanup
    const testWorkspaceName = "final-test-workspace";
    await db.bounty.deleteMany({
      where: {
        workspace: {
          name: testWorkspaceName,
        },
      },
    });
    await db.workspaceActivity.deleteMany({
      where: {
        workspace: {
          name: testWorkspaceName,
        },
      },
    });
    await db.workspaceBudget.deleteMany({
      where: {
        workspace: {
          name: testWorkspaceName,
        },
      },
    });
    await db.workspaceMember.deleteMany({
      where: {
        workspace: {
          name: testWorkspaceName,
        },
      },
    });
    await db.workspace.deleteMany({
      where: {
        name: testWorkspaceName,
      },
    });
    await db.user.deleteMany({
      where: {
        pubkey: {
          in: ["final-owner-pubkey", "final-hunter-pubkey", "final-contributor-pubkey"],
        },
      },
    });

    // Create test users
    ownerUser = await db.user.create({
      data: {
        pubkey: "final-owner-pubkey",
        username: "final_owner",
      },
    });

    hunterUser = await db.user.create({
      data: {
        pubkey: "final-hunter-pubkey",
        username: "final_hunter",
      },
    });

    contributorUser = await db.user.create({
      data: {
        pubkey: "final-contributor-pubkey",
        username: "final_contributor",
      },
    });

    // Create test workspace
    testWorkspace = await db.workspace.create({
      data: {
        name: testWorkspaceName,
        ownerPubkey: ownerUser.pubkey,
      },
    });

    // Create workspace budget
    await db.workspaceBudget.create({
      data: {
        workspaceId: testWorkspace.id,
        totalBudget: BigInt(1000000),
        availableBudget: BigInt(400000),
        reservedBudget: BigInt(300000),
        paidBudget: BigInt(300000),
      },
    });

    // Add members
    await db.workspaceMember.createMany({
      data: [
        {
          workspaceId: testWorkspace.id,
          userPubkey: ownerUser.pubkey,
          role: WorkspaceRole.OWNER,
        },
        {
          workspaceId: testWorkspace.id,
          userPubkey: hunterUser.pubkey,
          role: WorkspaceRole.CONTRIBUTOR,
        },
        {
          workspaceId: testWorkspace.id,
          userPubkey: contributorUser.pubkey,
          role: WorkspaceRole.CONTRIBUTOR,
        },
      ],
    });

    // Create bounties with different statuses
    const bounty1 = await db.bounty.create({
      data: {
        workspaceId: testWorkspace.id,
        title: "Test Bounty 1 - OPEN",
        description: "Open bounty",
        deliverables: "Complete the task",
        amount: BigInt(100000),
        status: BountyStatus.OPEN,
        creatorPubkey: ownerUser.pubkey,
      },
    });
    bounty1Id = bounty1.id;

    const bounty2 = await db.bounty.create({
      data: {
        workspaceId: testWorkspace.id,
        title: "Test Bounty 2 - ASSIGNED",
        description: "Assigned bounty",
        deliverables: "Complete the task",
        amount: BigInt(150000),
        status: BountyStatus.ASSIGNED,
        assigneePubkey: hunterUser.pubkey,
        creatorPubkey: ownerUser.pubkey,
      },
    });
    bounty2Id = bounty2.id;

    const bounty3 = await db.bounty.create({
      data: {
        workspaceId: testWorkspace.id,
        title: "Test Bounty 3 - COMPLETED",
        description: "Completed bounty",
        deliverables: "Complete the task",
        amount: BigInt(200000),
        status: BountyStatus.COMPLETED,
        assigneePubkey: hunterUser.pubkey,
        creatorPubkey: ownerUser.pubkey,
        completedAt: new Date(),
      },
    });
    bounty3Id = bounty3.id;

    const bounty4 = await db.bounty.create({
      data: {
        workspaceId: testWorkspace.id,
        title: "Test Bounty 4 - PAID",
        description: "Paid bounty",
        deliverables: "Complete the task",
        amount: BigInt(100000),
        status: BountyStatus.PAID,
        assigneePubkey: hunterUser.pubkey,
        creatorPubkey: ownerUser.pubkey,
        completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      },
    });
    bounty4Id = bounty4.id;

    // Create some workspace activities
    await db.workspaceActivity.createMany({
      data: [
        {
          workspaceId: testWorkspace.id,
          userPubkey: ownerUser.pubkey,
          action: WorkspaceActivityAction.MEMBER_ADDED,
          details: { memberPubkey: hunterUser.pubkey },
          timestamp: new Date(),
        },
        {
          workspaceId: testWorkspace.id,
          userPubkey: ownerUser.pubkey,
          action: WorkspaceActivityAction.BUDGET_DEPOSITED,
          details: { amount: "1000000" },
          timestamp: new Date(),
        },
      ],
    });
  });

  afterAll(async () => {
    await db.bounty.deleteMany({
      where: {
        id: {
          in: [bounty1Id, bounty2Id, bounty3Id, bounty4Id],
        },
      },
    });
    await db.workspaceActivity.deleteMany({
      where: {
        workspaceId: testWorkspace.id,
      },
    });
    await db.workspaceBudget.deleteMany({
      where: {
        workspaceId: testWorkspace.id,
      },
    });
    await db.workspaceMember.deleteMany({
      where: {
        workspaceId: testWorkspace.id,
      },
    });
    await db.workspace.deleteMany({
      where: {
        id: testWorkspace.id,
      },
    });
    await db.user.deleteMany({
      where: {
        pubkey: {
          in: [ownerUser.pubkey, hunterUser.pubkey, contributorUser.pubkey],
        },
      },
    });
  });

  describe("GET /api/leaderboard", () => {
    it("should return paginated leaderboard data", async () => {
      const request = createRequest("http://localhost/api/leaderboard?page=1&limit=10");
      const response = await GetLeaderboard(request);

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
      expect(data.meta.pagination).toBeDefined();
      expect(data.meta.pagination.page).toBe(1);
    });

    it("should include user details and earnings", async () => {
      const request = createRequest("http://localhost/api/leaderboard");
      const response = await GetLeaderboard(request);

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      if (data.data.length > 0) {
        const user = data.data[0];
        expect(user).toHaveProperty("pubkey");
        expect(user).toHaveProperty("username");
        expect(user).toHaveProperty("totalEarned");
        expect(user).toHaveProperty("bountiesCompleted");
      }
    });

    it("should sort by total earned descending", async () => {
      const request = createRequest("http://localhost/api/leaderboard?limit=100");
      const response = await GetLeaderboard(request);

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      if (data.data.length > 1) {
        const earnings = data.data.map((u: any) => BigInt(u.totalEarned));
        for (let i = 0; i < earnings.length - 1; i++) {
          expect(earnings[i] >= earnings[i + 1]).toBe(true);
        }
      }
    });

    it("should only include users with completed bounties", async () => {
      const request = createRequest("http://localhost/api/leaderboard");
      const response = await GetLeaderboard(request);

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      data.data.forEach((user: any) => {
        expect(user.bountiesCompleted).toBeGreaterThan(0);
        expect(BigInt(user.totalEarned)).toBeGreaterThan(BigInt(0));
      });
    });

    it("should reject invalid page parameter", async () => {
      const request = createRequest("http://localhost/api/leaderboard?page=0");
      const response = await GetLeaderboard(request);

      expect(response.status).toBe(422);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should reject limit exceeding maximum", async () => {
      const request = createRequest("http://localhost/api/leaderboard?limit=150");
      const response = await GetLeaderboard(request);

      expect(response.status).toBe(422);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });
  });

  describe("GET /api/workspaces/[id]/activities", () => {
    it("should return paginated activities for members", async () => {
      const request = createRequest(
        `http://localhost/api/workspaces/${testWorkspace.id}/activities`,
        ownerUser.pubkey
      );
      const response = await GetActivities(request, {
        params: Promise.resolve({ id: testWorkspace.id }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);
      expect(data.data.activities).toBeInstanceOf(Array);
      expect(data.data.pagination).toBeDefined();
    });

    it("should include activity details", async () => {
      const request = createRequest(
        `http://localhost/api/workspaces/${testWorkspace.id}/activities`,
        ownerUser.pubkey
      );
      const response = await GetActivities(request, {
        params: Promise.resolve({ id: testWorkspace.id }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      if (data.data.activities.length > 0) {
        const activity = data.data.activities[0];
        expect(activity).toHaveProperty("id");
        expect(activity).toHaveProperty("action");
        expect(activity).toHaveProperty("details");
        expect(activity).toHaveProperty("timestamp");
        expect(activity).toHaveProperty("user");
      }
    });

    it("should require authentication", async () => {
      const request = createRequest(
        `http://localhost/api/workspaces/${testWorkspace.id}/activities`
      );
      const response = await GetActivities(request, {
        params: Promise.resolve({ id: testWorkspace.id }),
      });

      expect(response.status).toBe(401);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should require workspace membership", async () => {
      const nonMember = await db.user.create({
        data: {
          pubkey: "final-non-member-pubkey",
          username: "final_non_member",
        },
      });

      const request = createRequest(
        `http://localhost/api/workspaces/${testWorkspace.id}/activities`,
        nonMember.pubkey
      );
      const response = await GetActivities(request, {
        params: Promise.resolve({ id: testWorkspace.id }),
      });

      expect(response.status).toBe(404);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);

      // Cleanup
      await db.user.delete({ where: { pubkey: nonMember.pubkey } });
    });

    it("should return 404 for non-existent workspace", async () => {
      const fakeId = "non-existent-workspace-id";
      const request = createRequest(
        `http://localhost/api/workspaces/${fakeId}/activities`,
        ownerUser.pubkey
      );
      const response = await GetActivities(request, {
        params: Promise.resolve({ id: fakeId }),
      });

      expect(response.status).toBe(404);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should respect pagination parameters", async () => {
      const request = createRequest(
        `http://localhost/api/workspaces/${testWorkspace.id}/activities?page=1&perPage=1`,
        ownerUser.pubkey
      );
      const response = await GetActivities(request, {
        params: Promise.resolve({ id: testWorkspace.id }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.data.pagination.page).toBe(1);
      expect(data.data.pagination.perPage).toBe(1);
      expect(data.data.activities.length).toBeLessThanOrEqual(1);
    });
  });

  describe("GET /api/admin/workspaces/[id]/stats", () => {
    it("should return stats for owner", async () => {
      const request = createRequest(
        `http://localhost/api/admin/workspaces/${testWorkspace.id}/stats`,
        ownerUser.pubkey
      );
      const response = await GetAdminStats(request, {
        params: Promise.resolve({ id: testWorkspace.id }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);
      expect(data.data.workspace).toBeDefined();
      expect(data.data.stats).toBeDefined();
    });

    it("should include bounty stats", async () => {
      const request = createRequest(
        `http://localhost/api/admin/workspaces/${testWorkspace.id}/stats`,
        ownerUser.pubkey
      );
      const response = await GetAdminStats(request, {
        params: Promise.resolve({ id: testWorkspace.id }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      const { bounties } = data.data.stats;
      expect(bounties.total).toBe(4);
      expect(bounties.open).toBe(1);
      expect(bounties.assigned).toBe(1);
      expect(bounties.completed).toBe(2); // COMPLETED + PAID
    });

    it("should include budget stats", async () => {
      const request = createRequest(
        `http://localhost/api/admin/workspaces/${testWorkspace.id}/stats`,
        ownerUser.pubkey
      );
      const response = await GetAdminStats(request, {
        params: Promise.resolve({ id: testWorkspace.id }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      const { budget } = data.data.stats;
      expect(budget.total).toBe("1000000");
      expect(budget.available).toBe("400000");
      expect(budget.reserved).toBe("300000");
      expect(budget.paid).toBe("300000");
    });

    it("should include member and activity counts", async () => {
      const request = createRequest(
        `http://localhost/api/admin/workspaces/${testWorkspace.id}/stats`,
        ownerUser.pubkey
      );
      const response = await GetAdminStats(request, {
        params: Promise.resolve({ id: testWorkspace.id }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.data.stats.members.total).toBe(3); // owner, hunter, contributor
      expect(data.data.stats.activities.total).toBe(2);
    });

    it("should include metrics", async () => {
      const request = createRequest(
        `http://localhost/api/admin/workspaces/${testWorkspace.id}/stats`,
        ownerUser.pubkey
      );
      const response = await GetAdminStats(request, {
        params: Promise.resolve({ id: testWorkspace.id }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      const { metrics } = data.data.stats;
      expect(metrics).toHaveProperty("averageCompletionTime");
      expect(metrics).toHaveProperty("completionRate");
      expect(metrics.completionRate).toBe(50); // 2 completed out of 4 total
    });

    it("should require authentication", async () => {
      const request = createRequest(
        `http://localhost/api/admin/workspaces/${testWorkspace.id}/stats`
      );
      const response = await GetAdminStats(request, {
        params: Promise.resolve({ id: testWorkspace.id }),
      });

      expect(response.status).toBe(401);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should reject non-members", async () => {
      const nonMember = await db.user.create({
        data: {
          pubkey: "final-stats-non-member".padEnd(66, "0"),
          username: "final_stats_non_m",
        },
      });

      const request = createRequest(
        `http://localhost/api/admin/workspaces/${testWorkspace.id}/stats`,
        nonMember.pubkey
      );
      const response = await GetAdminStats(request, {
        params: Promise.resolve({ id: testWorkspace.id }),
      });

      expect(response.status).toBe(403);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);

      // Cleanup
      await db.user.delete({ where: { pubkey: nonMember.pubkey } });
    });

    it("should reject contributor role", async () => {
      const request = createRequest(
        `http://localhost/api/admin/workspaces/${testWorkspace.id}/stats`,
        contributorUser.pubkey
      );
      const response = await GetAdminStats(request, {
        params: Promise.resolve({ id: testWorkspace.id }),
      });

      expect(response.status).toBe(403);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should return 403 for non-existent workspace", async () => {
      const fakeId = "non-existent-workspace-id";
      const request = createRequest(
        `http://localhost/api/admin/workspaces/${fakeId}/stats`,
        ownerUser.pubkey
      );
      const response = await GetAdminStats(request, {
        params: Promise.resolve({ id: fakeId }),
      });

      expect(response.status).toBe(403);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });
  });
});
