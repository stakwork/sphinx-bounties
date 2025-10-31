import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { BountyStatus, WorkspaceRole, BountyActivityAction, ProofStatus } from "@prisma/client";
import {
  createAuthedRequest,
  createTestUser,
  createTestWorkspace,
  createTestBounty,
  addWorkspaceMember,
  cleanupTestUsers,
  connectTestDb,
  disconnectTestDb,
  generateTestPubkey,
  parseResponse,
} from "../utils";
import { POST as AssignPost } from "@/app/api/bounties/[id]/assign/route";
import { PATCH as UpdatePatch } from "@/app/api/workspaces/[id]/bounties/[bountyId]/route";
import { PATCH as CompletePatch } from "@/app/api/workspaces/[id]/bounties/[bountyId]/complete/route";
import { PATCH as CancelPatch } from "@/app/api/workspaces/[id]/bounties/[bountyId]/cancel/route";

describe("Bounty Lifecycle Integration Tests", () => {
  const ownerPubkey = generateTestPubkey("owner");
  const contributorPubkey = generateTestPubkey("contrib");
  const viewerPubkey = generateTestPubkey("viewer");

  let workspaceId: string;
  let bountyId: string;

  beforeAll(async () => {
    await connectTestDb();
    // Clean up any existing users first
    await cleanupTestUsers([ownerPubkey, contributorPubkey, viewerPubkey]);
    // Create test users with unique names (max 20 chars)
    const suffix = Date.now().toString().slice(-6);
    await createTestUser({ pubkey: ownerPubkey, username: `bown-${suffix}` });
    await createTestUser({ pubkey: contributorPubkey, username: `bcon-${suffix}` });
    await createTestUser({ pubkey: viewerPubkey, username: `bview-${suffix}` });
  });

  afterAll(async () => {
    await cleanupTestUsers([ownerPubkey, contributorPubkey, viewerPubkey]);
    await disconnectTestDb();
  });

  beforeEach(async () => {
    // Clean up all test data
    await db.bountyActivity.deleteMany({
      where: {
        bounty: {
          workspace: {
            ownerPubkey: { in: [ownerPubkey, contributorPubkey, viewerPubkey] },
          },
        },
      },
    });

    await db.bountyProof.deleteMany({
      where: {
        bounty: {
          workspace: {
            ownerPubkey: { in: [ownerPubkey, contributorPubkey, viewerPubkey] },
          },
        },
      },
    });

    await db.bounty.deleteMany({
      where: {
        workspace: {
          ownerPubkey: { in: [ownerPubkey, contributorPubkey, viewerPubkey] },
        },
      },
    });

    await db.workspaceMember.deleteMany({
      where: {
        userPubkey: { in: [ownerPubkey, contributorPubkey, viewerPubkey] },
      },
    });

    await db.workspaceBudget.deleteMany({
      where: {
        workspace: {
          ownerPubkey: { in: [ownerPubkey, contributorPubkey, viewerPubkey] },
        },
      },
    });

    await db.workspace.deleteMany({
      where: {
        ownerPubkey: { in: [ownerPubkey, contributorPubkey, viewerPubkey] },
      },
    });

    // Create fresh workspace and bounty
    const { workspace } = await createTestWorkspace({
      ownerPubkey,
      name: `Test Workspace ${Date.now()}`,
    });
    workspaceId = workspace.id;

    // Add contributor and viewer
    await addWorkspaceMember({
      workspaceId,
      userPubkey: contributorPubkey,
      role: WorkspaceRole.CONTRIBUTOR,
    });

    await addWorkspaceMember({
      workspaceId,
      userPubkey: viewerPubkey,
      role: WorkspaceRole.VIEWER,
    });

    // Update workspace budget
    await db.workspaceBudget.update({
      where: { workspaceId },
      data: {
        totalBudget: 1000000,
        availableBudget: 800000,
        reservedBudget: 200000,
      },
    });

    // Create a bounty in OPEN status
    const bounty = await createTestBounty({
      workspaceId,
      creatorPubkey: ownerPubkey,
      amount: 50000,
      status: BountyStatus.OPEN,
    });
    bountyId = bounty.id;
  });

  describe("Update Bounty", () => {
    it("should allow owner to update bounty details", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}`,
        ownerPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({
            id: bountyId,
            title: "Updated Bounty Title",
            description: "Updated description with sufficient length for validation requirements",
            amount: 75000,
          }),
        }
      );

      const response = await UpdatePatch(request, {
        params: Promise.resolve({ id: workspaceId, bountyId }),
      });

      expect(response.status).toBe(200);

      const data = await parseResponse(response);
      expect(data).toMatchObject({
        success: true,
        data: {
          message: expect.stringContaining("updated"),
          bounty: {
            id: bountyId,
            title: "Updated Bounty Title",
            amount: "75000",
          },
        },
      });

      // Verify budget was adjusted
      const budget = await db.workspaceBudget.findUnique({
        where: { workspaceId },
      });

      expect(budget?.reservedBudget).toBe(225000); // 200000 + (75000 - 50000)
      expect(budget?.availableBudget).toBe(775000); // 800000 - (75000 - 50000)
    });

    it("should allow creator to update bounty (non-amount fields)", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}`,
        ownerPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({
            id: bountyId,
            title: "Creator Updated Title",
            tags: ["frontend", "react"],
          }),
        }
      );

      const response = await UpdatePatch(request, {
        params: Promise.resolve({ id: workspaceId, bountyId }),
      });

      expect(response.status).toBe(200);
    });

    it("should not allow creator to change amount", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}`,
        contributorPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({
            id: bountyId,
            amount: 100000,
          }),
        }
      );

      const response = await UpdatePatch(request, {
        params: Promise.resolve({ id: workspaceId, bountyId }),
      });

      expect(response.status).toBe(403);
    });

    it("should not allow updating completed bounty", async () => {
      await db.bounty.update({
        where: { id: bountyId },
        data: { status: BountyStatus.COMPLETED },
      });

      const request = createAuthedRequest(
        `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}`,
        ownerPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({
            id: bountyId,
            title: "Should not update",
          }),
        }
      );

      const response = await UpdatePatch(request, {
        params: Promise.resolve({ id: workspaceId, bountyId }),
      });

      expect(response.status).toBe(400);
    });

    it("should not allow amount increase beyond available budget", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}`,
        ownerPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({
            id: bountyId,
            amount: 1000000, // Would exceed available budget
          }),
        }
      );

      const response = await UpdatePatch(request, {
        params: Promise.resolve({ id: workspaceId, bountyId }),
      });

      expect(response.status).toBe(400);
      const data = await parseResponse(response);
      expect(data).toMatchObject({
        success: false,
        error: {
          code: "INSUFFICIENT_BUDGET",
        },
      });
    });
  });

  describe("Complete Bounty", () => {
    beforeEach(async () => {
      // Set bounty to IN_REVIEW with accepted proof
      await db.bounty.update({
        where: { id: bountyId },
        data: {
          status: BountyStatus.IN_REVIEW,
          assigneePubkey: contributorPubkey,
        },
      });

      await db.bountyProof.create({
        data: {
          bountyId,
          submittedByPubkey: contributorPubkey,
          description: "Completed work proof",
          proofUrl: "https://github.com/test/pr/1",
          status: ProofStatus.ACCEPTED,
          reviewedByPubkey: ownerPubkey,
          reviewedAt: new Date(),
        },
      });
    });

    it("should allow admin to complete bounty with accepted proof", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/complete`,
        ownerPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({ bountyId }),
        }
      );

      const response = await CompletePatch(request, {
        params: Promise.resolve({ id: workspaceId, bountyId }),
      });

      expect(response.status).toBe(200);

      const data = await parseResponse(response);
      expect(data).toMatchObject({
        success: true,
        data: {
          message: expect.stringContaining("completed"),
        },
      });

      // Verify bounty status and timestamp
      const updatedBounty = await db.bounty.findUnique({
        where: { id: bountyId },
      });

      expect(updatedBounty?.status).toBe(BountyStatus.COMPLETED);
      expect(updatedBounty?.completedAt).toBeTruthy();

      // Verify activity
      const activity = await db.bountyActivity.findFirst({
        where: {
          bountyId,
          action: BountyActivityAction.COMPLETED,
        },
      });

      expect(activity).toBeTruthy();
    });

    it("should not allow contributor to complete bounty", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/complete`,
        contributorPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({ bountyId }),
        }
      );

      const response = await CompletePatch(request, {
        params: Promise.resolve({ id: workspaceId, bountyId }),
      });

      expect(response.status).toBe(403);
    });

    it("should not allow completing bounty without accepted proof", async () => {
      // Remove accepted proof
      await db.bountyProof.deleteMany({
        where: { bountyId },
      });

      const request = createAuthedRequest(
        `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/complete`,
        ownerPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({ bountyId }),
        }
      );

      const response = await CompletePatch(request, {
        params: Promise.resolve({ id: workspaceId, bountyId }),
      });

      expect(response.status).toBe(400);
      const data = await parseResponse(response);
      expect(data).toMatchObject({
        success: false,
        error: {
          code: "NO_ACCEPTED_PROOF",
        },
      });
    });

    it("should not allow completing non-IN_REVIEW bounty", async () => {
      await db.bounty.update({
        where: { id: bountyId },
        data: { status: BountyStatus.ASSIGNED },
      });

      const request = createAuthedRequest(
        `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/complete`,
        ownerPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({ bountyId }),
        }
      );

      const response = await CompletePatch(request, {
        params: Promise.resolve({ id: workspaceId, bountyId }),
      });

      expect(response.status).toBe(400);
      const data = await parseResponse(response);
      expect(data).toMatchObject({
        success: false,
        error: {
          code: "INVALID_STATUS",
        },
      });
    });
  });

  describe("Cancel Bounty", () => {
    it("should allow owner to cancel bounty", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/cancel`,
        ownerPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({
            bountyId,
            reason: "Requirements changed significantly",
          }),
        }
      );

      const response = await CancelPatch(request, {
        params: Promise.resolve({ id: workspaceId, bountyId }),
      });

      expect(response.status).toBe(200);

      const data = await parseResponse(response);
      expect(data).toMatchObject({
        success: true,
        data: {
          message: expect.stringContaining("cancelled"),
        },
      });

      // Verify bounty status
      const updatedBounty = await db.bounty.findUnique({
        where: { id: bountyId },
      });

      expect(updatedBounty?.status).toBe(BountyStatus.CANCELLED);

      // Verify budget was released
      const budget = await db.workspaceBudget.findUnique({
        where: { workspaceId },
      });

      expect(budget?.availableBudget).toBe(850000); // 800000 + 50000
      expect(budget?.reservedBudget).toBe(150000); // 200000 - 50000

      // Verify activity
      const activity = await db.bountyActivity.findFirst({
        where: {
          bountyId,
          action: BountyActivityAction.CANCELLED,
        },
      });

      expect(activity).toBeTruthy();
      expect(activity?.details).toMatchObject({
        reason: "Requirements changed significantly",
      });
    });

    it("should allow creator to cancel their bounty", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/cancel`,
        ownerPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({
            bountyId,
            reason: "No longer needed",
          }),
        }
      );

      const response = await CancelPatch(request, {
        params: Promise.resolve({ id: workspaceId, bountyId }),
      });

      expect(response.status).toBe(200);
    });

    it("should not allow contributor to cancel bounty they didn't create", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/cancel`,
        contributorPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({
            bountyId,
            reason: "Test reason",
          }),
        }
      );

      const response = await CancelPatch(request, {
        params: Promise.resolve({ id: workspaceId, bountyId }),
      });

      expect(response.status).toBe(403);
    });

    it("should not allow cancelling completed bounty", async () => {
      await db.bounty.update({
        where: { id: bountyId },
        data: { status: BountyStatus.COMPLETED },
      });

      const request = createAuthedRequest(
        `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/cancel`,
        ownerPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({
            bountyId,
            reason: "Test reason",
          }),
        }
      );

      const response = await CancelPatch(request, {
        params: Promise.resolve({ id: workspaceId, bountyId }),
      });

      expect(response.status).toBe(400);
      const data = await parseResponse(response);
      expect(data).toMatchObject({
        success: false,
        error: {
          code: "BOUNTY_COMPLETED",
        },
      });
    });

    it("should require reason with minimum length", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/cancel`,
        ownerPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({
            bountyId,
            reason: "short",
          }),
        }
      );

      const response = await CancelPatch(request, {
        params: Promise.resolve({ id: workspaceId, bountyId }),
      });

      expect(response.status).toBe(422);
      const data = await parseResponse(response);
      expect(data).toMatchObject({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
        },
      });
    });
  });

  describe("Full Lifecycle Flow", () => {
    it("should handle complete bounty lifecycle: assign -> update -> complete -> cannot cancel", async () => {
      // 1. Admin assigns bounty to contributor
      const assignRequest = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/assign`,
        ownerPubkey,
        {
          method: "POST",
          body: JSON.stringify({ assigneePubkey: contributorPubkey }),
        }
      );

      const assignResponse = await AssignPost(assignRequest, {
        params: Promise.resolve({ id: bountyId }),
      });
      expect(assignResponse.status).toBe(200);

      // 2. Update bounty
      const updateRequest = createAuthedRequest(
        `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}`,
        ownerPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({
            id: bountyId,
            title: "Updated during assignment",
          }),
        }
      );

      const updateResponse = await UpdatePatch(updateRequest, {
        params: Promise.resolve({ id: workspaceId, bountyId }),
      });
      expect(updateResponse.status).toBe(200);

      // 3. Move to IN_REVIEW with accepted proof
      await db.bounty.update({
        where: { id: bountyId },
        data: { status: BountyStatus.IN_REVIEW },
      });

      await db.bountyProof.create({
        data: {
          bountyId,
          submittedByPubkey: contributorPubkey,
          description: "Final proof of work",
          proofUrl: "https://github.com/test/pr/final",
          status: ProofStatus.ACCEPTED,
          reviewedByPubkey: ownerPubkey,
          reviewedAt: new Date(),
        },
      });

      // 4. Complete bounty
      const completeRequest = createAuthedRequest(
        `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/complete`,
        ownerPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({ bountyId }),
        }
      );

      const completeResponse = await CompletePatch(completeRequest, {
        params: Promise.resolve({ id: workspaceId, bountyId }),
      });
      expect(completeResponse.status).toBe(200);

      // 5. Try to cancel (should fail)
      const cancelRequest = createAuthedRequest(
        `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/cancel`,
        ownerPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({
            bountyId,
            reason: "Should not be able to cancel completed bounty",
          }),
        }
      );

      const cancelResponse = await CancelPatch(cancelRequest, {
        params: Promise.resolve({ id: workspaceId, bountyId }),
      });
      expect(cancelResponse.status).toBe(400);

      // Verify final state
      const finalBounty = await db.bounty.findUnique({
        where: { id: bountyId },
      });

      expect(finalBounty?.status).toBe(BountyStatus.COMPLETED);
      expect(finalBounty?.assigneePubkey).toBe(contributorPubkey);
      expect(finalBounty?.completedAt).toBeTruthy();

      // Verify all activities were logged
      const activities = await db.bountyActivity.findMany({
        where: { bountyId },
        orderBy: { timestamp: "asc" },
      });

      const actionTypes = activities.map((a) => a.action);
      expect(actionTypes).toContain(BountyActivityAction.ASSIGNED);
      expect(actionTypes).toContain(BountyActivityAction.UPDATED);
      expect(actionTypes).toContain(BountyActivityAction.COMPLETED);
    });
  });
});
