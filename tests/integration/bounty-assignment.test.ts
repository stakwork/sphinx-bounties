/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { BountyStatus, WorkspaceRole, BountyActivityAction } from "@prisma/client";
import {
  connectTestDb,
  disconnectTestDb,
  createTestUser,
  createTestWorkspace,
  createTestBounty,
  cleanupTestUsers,
  addWorkspaceMember,
  createAuthedRequest,
  parseResponse,
} from "../utils";
import { db } from "@/lib/db";
import {
  POST as AssignBounty,
  DELETE as UnassignBounty,
} from "@/app/api/bounties/[id]/assign/route";

describe("Bounty Assignment Integration Tests", () => {
  const adminPubkey = "02admin1234567890123456789012345678901234567890123456789012345";
  const hunterPubkey = "02hunter123456789012345678901234567890123456789012345678901234";
  const nonMemberPubkey = "02nonmem123456789012345678901234567890123456789012345678901234";
  const regularMemberPubkey = "02member123456789012345678901234567890123456789012345678901234";

  let workspaceId: string;
  let bountyId: string;

  beforeAll(async () => {
    await connectTestDb();

    // Clean up any leftover users from previous failed runs (by username)
    try {
      const existingUsers = await db.user.findMany({
        where: {
          username: { in: ["assign_admin", "assign_hunter", "assign_nonmember", "assign_member"] },
        },
        select: { pubkey: true },
      });
      if (existingUsers.length > 0) {
        await cleanupTestUsers(existingUsers.map((u) => u.pubkey));
      }
    } catch (_e) {
      // Ignore errors if users don't exist
    }

    await createTestUser({ pubkey: adminPubkey, username: "assign_admin" });
    await createTestUser({ pubkey: hunterPubkey, username: "assign_hunter" });
    await createTestUser({ pubkey: nonMemberPubkey, username: "assign_nonmember" });
    await createTestUser({ pubkey: regularMemberPubkey, username: "assign_member" });
  });

  afterAll(async () => {
    await cleanupTestUsers([adminPubkey, hunterPubkey, nonMemberPubkey, regularMemberPubkey]);
    await disconnectTestDb();
  });

  beforeEach(async () => {
    // Clean up previous test data (only from assignment tests)
    await db.bountyActivity.deleteMany({});
    await db.bounty.deleteMany({
      where: {
        workspace: {
          name: { startsWith: "assign-test-ws-" },
        },
      },
    });
    await db.workspace.deleteMany({
      where: {
        name: { startsWith: "assign-test-ws-" },
      },
    });

    // Create fresh test data for each test
    const { workspace } = await createTestWorkspace({
      ownerPubkey: adminPubkey,
      name: `assign-test-ws-${Date.now()}`,
      description: "Workspace for testing bounty assignment",
    });
    workspaceId = workspace.id;

    // Add hunter as workspace member
    await addWorkspaceMember({
      workspaceId,
      userPubkey: hunterPubkey,
      role: WorkspaceRole.CONTRIBUTOR,
    });

    // Add regular member
    await addWorkspaceMember({
      workspaceId,
      userPubkey: regularMemberPubkey,
      role: WorkspaceRole.CONTRIBUTOR,
    });

    // Ensure workspace has enough budget for bounty
    await db.workspaceBudget.update({
      where: { workspaceId },
      data: { availableBudget: 100000 }, // Ensure enough budget
    });

    // Create OPEN bounty
    const bounty = await createTestBounty({
      workspaceId,
      creatorPubkey: adminPubkey,
      title: `Test Bounty ${Date.now()}`,
      description: "Test bounty description that is long enough to pass validation",
      deliverables: "Test deliverables description for bounty completion",
      amount: 50000,
      status: BountyStatus.OPEN,
    });
    bountyId = bounty.id;
  });

  describe("POST /api/bounties/[id]/assign", () => {
    it("should assign bounty to workspace member as admin", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/assign`,
        adminPubkey,
        {
          method: "POST",
          body: JSON.stringify({ assigneePubkey: hunterPubkey }),
        }
      );

      const response = await AssignBounty(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      const data: any = await parseResponse(response);
      if (response.status !== 200) {
        console.error("Assignment failed:", data);
      }
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.message).toBe("Bounty assigned successfully");
      expect(data.data.assignee.pubkey).toBe(hunterPubkey);
      expect(data.data.assignee.username).toBe("assign_hunter");

      // Verify bounty was assigned in database
      const updatedBounty = await db.bounty.findUnique({
        where: { id: bountyId },
      });
      expect(updatedBounty?.assigneePubkey).toBe(hunterPubkey);
      expect(updatedBounty?.status).toBe(BountyStatus.ASSIGNED);
      expect(updatedBounty?.assignedAt).not.toBeNull();

      // Verify budget was reserved
      const budget = await db.workspaceBudget.findUnique({
        where: { workspaceId },
      });
      expect(Number(budget?.reservedBudget)).toBe(50000);
      expect(Number(budget?.availableBudget)).toBe(50000); // Started with 100000, reserved 50000

      // Verify activity was logged
      const activity = await db.bountyActivity.findFirst({
        where: { bountyId, action: BountyActivityAction.ASSIGNED },
      });
      expect(activity).not.toBeNull();
      expect(activity?.userPubkey).toBe(adminPubkey);
    });

    it("should reject assignment with missing assigneePubkey", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/assign`,
        adminPubkey,
        {
          method: "POST",
          body: JSON.stringify({}),
        }
      );

      const response = await AssignBounty(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(400);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("assigneePubkey is required");
    });

    it("should reject assignment to non-existent user", async () => {
      const fakeUserPubkey = "02fake1234567890123456789012345678901234567890123456789012345678";
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/assign`,
        adminPubkey,
        {
          method: "POST",
          body: JSON.stringify({ assigneePubkey: fakeUserPubkey }),
        }
      );

      const response = await AssignBounty(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(404);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("Assignee not found");
    });

    it("should reject assignment to non-workspace-member", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/assign`,
        adminPubkey,
        {
          method: "POST",
          body: JSON.stringify({ assigneePubkey: nonMemberPubkey }),
        }
      );

      const response = await AssignBounty(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(403);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("Assignee must be a workspace member");
    });

    it("should reject assignment by non-admin", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/assign`,
        regularMemberPubkey,
        {
          method: "POST",
          body: JSON.stringify({ assigneePubkey: hunterPubkey }),
        }
      );

      const response = await AssignBounty(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(403);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("Only workspace admins can assign bounties");
    });

    it("should reject assignment of non-OPEN bounty", async () => {
      // Update bounty to DRAFT status
      await db.bounty.update({
        where: { id: bountyId },
        data: { status: BountyStatus.DRAFT },
      });

      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/assign`,
        adminPubkey,
        {
          method: "POST",
          body: JSON.stringify({ assigneePubkey: hunterPubkey }),
        }
      );

      const response = await AssignBounty(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(400);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("Can only assign bounties with OPEN status");
    });

    it("should reject assignment of already assigned bounty", async () => {
      // Assign bounty first (need to reserve budget too)
      await db.bounty.update({
        where: { id: bountyId },
        data: {
          assigneePubkey: hunterPubkey,
          status: BountyStatus.ASSIGNED,
          assignedAt: new Date(),
        },
      });
      await db.workspaceBudget.update({
        where: { workspaceId },
        data: {
          availableBudget: { decrement: 50000 },
          reservedBudget: { increment: 50000 },
        },
      });

      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/assign`,
        adminPubkey,
        {
          method: "POST",
          body: JSON.stringify({ assigneePubkey: regularMemberPubkey }),
        }
      );

      const response = await AssignBounty(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(400);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
      // Status check happens before assigneePubkey check in the API
      expect(data.error.message).toContain("Can only assign bounties with OPEN status");
    });

    it("should reject assignment with insufficient budget", async () => {
      // Reduce available budget
      await db.workspaceBudget.update({
        where: { workspaceId },
        data: { availableBudget: 10000 }, // Less than bounty amount (50000)
      });

      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/assign`,
        adminPubkey,
        {
          method: "POST",
          body: JSON.stringify({ assigneePubkey: hunterPubkey }),
        }
      );

      const response = await AssignBounty(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(400);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("Insufficient available budget");
    });

    it("should return 404 for non-existent bounty", async () => {
      const fakeBountyId = "00000000-0000-0000-0000-000000000000";
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${fakeBountyId}/assign`,
        adminPubkey,
        {
          method: "POST",
          body: JSON.stringify({ assigneePubkey: hunterPubkey }),
        }
      );

      const response = await AssignBounty(request, {
        params: Promise.resolve({ id: fakeBountyId }),
      });

      expect(response.status).toBe(404);
    });

    it("should require authentication", async () => {
      const request = new Request(`http://localhost/api/bounties/${bountyId}/assign`, {
        method: "POST",
        body: JSON.stringify({ assigneePubkey: hunterPubkey }),
      }) as any;

      const response = await AssignBounty(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /api/bounties/[id]/assign", () => {
    beforeEach(async () => {
      // Assign the bounty before each unassign test
      await db.bounty.update({
        where: { id: bountyId },
        data: {
          assigneePubkey: hunterPubkey,
          status: BountyStatus.ASSIGNED,
          assignedAt: new Date(),
        },
      });

      // Reserve budget
      await db.workspaceBudget.update({
        where: { workspaceId },
        data: {
          availableBudget: { decrement: 50000 },
          reservedBudget: { increment: 50000 },
        },
      });
    });

    it("should unassign bounty as admin", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/assign`,
        adminPubkey,
        { method: "DELETE" }
      );

      const response = await UnassignBounty(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);
      expect(data.data.message).toBe("Bounty unassigned successfully");

      // Verify bounty was unassigned in database
      const updatedBounty = await db.bounty.findUnique({
        where: { id: bountyId },
      });
      expect(updatedBounty?.assigneePubkey).toBeNull();
      expect(updatedBounty?.status).toBe(BountyStatus.OPEN);
      expect(updatedBounty?.assignedAt).toBeNull();

      // Verify budget was unreserved (BigInt values)
      const budget = await db.workspaceBudget.findUnique({
        where: { workspaceId },
      });
      expect(Number(budget?.reservedBudget)).toBe(0);
      expect(Number(budget?.availableBudget)).toBe(100000); // Returned to available (was 100000 initially)

      // Verify activity was logged
      const activity = await db.bountyActivity.findFirst({
        where: { bountyId, action: BountyActivityAction.UNASSIGNED },
      });
      expect(activity).not.toBeNull();
      expect(activity?.userPubkey).toBe(adminPubkey);
    });

    it("should unassign bounty in IN_REVIEW status", async () => {
      // Update bounty to IN_REVIEW
      await db.bounty.update({
        where: { id: bountyId },
        data: { status: BountyStatus.IN_REVIEW },
      });

      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/assign`,
        adminPubkey,
        { method: "DELETE" }
      );

      const response = await UnassignBounty(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);
    });

    it("should reject unassignment by non-admin", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/assign`,
        regularMemberPubkey,
        { method: "DELETE" }
      );

      const response = await UnassignBounty(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(403);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("Only workspace admins can unassign bounties");
    });

    it("should reject unassignment of unassigned bounty", async () => {
      // Unassign the bounty first
      await db.bounty.update({
        where: { id: bountyId },
        data: {
          assigneePubkey: null,
          status: BountyStatus.OPEN,
          assignedAt: null,
        },
      });

      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/assign`,
        adminPubkey,
        { method: "DELETE" }
      );

      const response = await UnassignBounty(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(400);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain("Bounty is not assigned");
    });

    it("should reject unassignment of completed bounty", async () => {
      // Update bounty to COMPLETED status
      await db.bounty.update({
        where: { id: bountyId },
        data: { status: BountyStatus.COMPLETED },
      });

      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/assign`,
        adminPubkey,
        { method: "DELETE" }
      );

      const response = await UnassignBounty(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(400);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain(
        "Can only unassign bounties with ASSIGNED or IN_REVIEW status"
      );
    });

    it("should return 404 for non-existent bounty", async () => {
      const fakeBountyId = "00000000-0000-0000-0000-000000000000";
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${fakeBountyId}/assign`,
        adminPubkey,
        { method: "DELETE" }
      );

      const response = await UnassignBounty(request, {
        params: Promise.resolve({ id: fakeBountyId }),
      });

      expect(response.status).toBe(404);
    });

    it("should require authentication", async () => {
      const request = new Request(`http://localhost/api/bounties/${bountyId}/assign`, {
        method: "DELETE",
      }) as any;

      const response = await UnassignBounty(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(401);
    });
  });
});
