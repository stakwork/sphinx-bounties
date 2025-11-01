import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { BountyStatus, ProofStatus, BountyActivityAction } from "@prisma/client";
import { POST as SubmitProof, GET as ListProofs } from "@/app/api/bounties/[id]/proofs/route";
import {
  PATCH as ReviewProof,
  DELETE as DeleteProof,
} from "@/app/api/bounties/[id]/proofs/[proofId]/route";
import { db } from "@/lib/db";
import { createAuthedRequest, parseResponse } from "../utils/test-api";
import {
  createTestUser,
  createTestWorkspace,
  cleanupTestUsers,
  disconnectTestDb,
} from "../utils/test-db";

describe("Bounty Proofs Integration Tests", () => {
  let ownerPubkey: string;
  let contributorPubkey: string;
  let viewerPubkey: string;
  let workspaceId: string;
  let bountyId: string;

  beforeAll(async () => {
    // Clean up any existing test users first
    const timestamp = Date.now();
    const suffix = timestamp.toString().slice(-6);

    ownerPubkey = `owner-${suffix}`;
    contributorPubkey = `contrib-${suffix}`;
    viewerPubkey = `viewer-${suffix}`;

    await cleanupTestUsers([ownerPubkey, contributorPubkey, viewerPubkey]);

    // Create test users
    await createTestUser({
      pubkey: ownerPubkey,
      username: `pown-${suffix}`,
    });

    await createTestUser({
      pubkey: contributorPubkey,
      username: `pcon-${suffix}`,
    });

    await createTestUser({
      pubkey: viewerPubkey,
      username: `pview-${suffix}`,
    });
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
      name: `Proof Test WS ${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
    });
    workspaceId = workspace.id;

    // Add contributor and viewer as members
    await db.workspaceMember.createMany({
      data: [
        {
          workspaceId,
          userPubkey: contributorPubkey,
          role: "CONTRIBUTOR",
        },
        {
          workspaceId,
          userPubkey: viewerPubkey,
          role: "VIEWER",
        },
      ],
    });

    // Create a bounty and assign it to contributor
    const bounty = await db.bounty.create({
      data: {
        workspaceId,
        title: "Test Bounty for Proofs",
        description: "This is a test bounty for proof submissions",
        deliverables: "Complete the implementation and submit proof",
        amount: 5000,
        status: BountyStatus.ASSIGNED,
        assigneePubkey: contributorPubkey,
        assignedAt: new Date(),
        creatorPubkey: ownerPubkey,
        tags: ["test"],
        codingLanguages: [],
      },
    });
    bountyId = bounty.id;
  });

  describe("Submit Proof", () => {
    it("should allow assignee to submit proof", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/proofs`,
        contributorPubkey,
        {
          method: "POST",
          body: JSON.stringify({
            proofUrl: "https://github.com/test/repo/pull/123",
            description: "Implemented the feature as requested with full test coverage",
          }),
        }
      );

      const response = await SubmitProof(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(201);

      const data = await parseResponse(response);
      expect(data).toMatchObject({
        success: true,
        data: {
          id: expect.any(String),
          bountyId,
          proofUrl: "https://github.com/test/repo/pull/123",
          status: "PENDING",
        },
      });

      // Verify bounty status changed to IN_REVIEW
      const updatedBounty = await db.bounty.findUnique({
        where: { id: bountyId },
      });
      expect(updatedBounty?.status).toBe(BountyStatus.IN_REVIEW);

      // Verify activity was logged
      const activity = await db.bountyActivity.findFirst({
        where: {
          bountyId,
          action: BountyActivityAction.PROOF_SUBMITTED,
        },
      });
      expect(activity).toBeTruthy();
    });

    it("should not allow non-assignee to submit proof", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/proofs`,
        viewerPubkey,
        {
          method: "POST",
          body: JSON.stringify({
            proofUrl: "https://github.com/test/repo/pull/123",
            description: "Implemented the feature as requested with full test coverage",
          }),
        }
      );

      const response = await SubmitProof(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(403);
    });

    it("should not allow proof submission for non-assigned bounty", async () => {
      // Update bounty to OPEN status
      await db.bounty.update({
        where: { id: bountyId },
        data: {
          status: BountyStatus.OPEN,
          assigneePubkey: null,
          assignedAt: null,
        },
      });

      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/proofs`,
        contributorPubkey,
        {
          method: "POST",
          body: JSON.stringify({
            proofUrl: "https://github.com/test/repo/pull/123",
            description: "Implemented the feature as requested with full test coverage",
          }),
        }
      );

      const response = await SubmitProof(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(403);
    });

    it("should validate proof URL", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/proofs`,
        contributorPubkey,
        {
          method: "POST",
          body: JSON.stringify({
            proofUrl: "not-a-valid-url",
            description: "Implemented the feature as requested with full test coverage",
          }),
        }
      );

      const response = await SubmitProof(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(400);
    });

    it("should validate description length", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/proofs`,
        contributorPubkey,
        {
          method: "POST",
          body: JSON.stringify({
            proofUrl: "https://github.com/test/repo/pull/123",
            description: "Too short",
          }),
        }
      );

      const response = await SubmitProof(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("List Proofs", () => {
    let proof1Id: string;
    let proof2Id: string;

    beforeEach(async () => {
      // Create some proofs
      const proof1 = await db.bountyProof.create({
        data: {
          bountyId,
          submittedByPubkey: contributorPubkey,
          proofUrl: "https://github.com/test/repo/pull/123",
          description: "First proof submission with comprehensive implementation",
          status: ProofStatus.REJECTED,
        },
      });
      proof1Id = proof1.id;

      const proof2 = await db.bountyProof.create({
        data: {
          bountyId,
          submittedByPubkey: contributorPubkey,
          proofUrl: "https://github.com/test/repo/pull/124",
          description: "Second proof submission with requested changes",
          status: ProofStatus.PENDING,
        },
      });
      proof2Id = proof2.id;
    });

    it("should list all proofs for workspace members", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/proofs`,
        ownerPubkey,
        { method: "GET" }
      );

      const response = await ListProofs(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(200);

      const data = await parseResponse(response);
      expect(data).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: proof1Id,
            status: ProofStatus.REJECTED,
          }),
          expect.objectContaining({
            id: proof2Id,
            status: ProofStatus.PENDING,
          }),
        ]),
        meta: {
          pagination: {
            totalCount: 2,
            page: 1,
          },
        },
      });
    });

    it("should not allow non-members to list proofs", async () => {
      // Create a new user who's not a member
      const outsiderPubkey = `outsider-${Date.now()}`;
      await createTestUser({
        pubkey: outsiderPubkey,
        username: `out-${Date.now().toString().slice(-6)}`,
      });

      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/proofs`,
        outsiderPubkey,
        { method: "GET" }
      );

      const response = await ListProofs(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(403);

      // Cleanup
      await cleanupTestUsers([outsiderPubkey]);
    });

    it("should support pagination", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/proofs?page=1&limit=1`,
        ownerPubkey,
        { method: "GET" }
      );

      const response = await ListProofs(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(200);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (await parseResponse(response)) as any;
      expect(data.data).toHaveLength(1);
      expect(data.meta.pagination).toMatchObject({
        totalCount: 2,
        page: 1,
        pageSize: 1,
        totalPages: 2,
      });
    });
  });

  describe("Review Proof", () => {
    let proofId: string;

    beforeEach(async () => {
      const proof = await db.bountyProof.create({
        data: {
          bountyId,
          submittedByPubkey: contributorPubkey,
          proofUrl: "https://github.com/test/repo/pull/123",
          description: "Proof submission for review with complete implementation",
          status: ProofStatus.PENDING,
        },
      });
      proofId = proof.id;
    });

    it("should allow owner to approve proof", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/proofs/${proofId}`,
        ownerPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({
            approved: true,
            feedback: "Great work! The implementation looks solid.",
          }),
        }
      );

      const response = await ReviewProof(request, {
        params: Promise.resolve({ id: bountyId, proofId }),
      });

      expect(response.status).toBe(200);

      const data = await parseResponse(response);
      expect(data).toMatchObject({
        success: true,
        data: {
          id: proofId,
          status: "ACCEPTED",
          reviewNotes: "Great work! The implementation looks solid.",
        },
      });

      // Verify activity was logged
      const activity = await db.bountyActivity.findFirst({
        where: {
          bountyId,
          action: BountyActivityAction.PROOF_REVIEWED,
        },
      });
      expect(activity).toBeTruthy();
    });

    it("should allow owner to reject proof", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/proofs/${proofId}`,
        ownerPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({
            approved: false,
            feedback: "Please add more test coverage and fix the edge cases.",
          }),
        }
      );

      const response = await ReviewProof(request, {
        params: Promise.resolve({ id: bountyId, proofId }),
      });

      expect(response.status).toBe(200);

      const data = await parseResponse(response);
      expect(data).toMatchObject({
        success: true,
        data: {
          id: proofId,
          status: "REJECTED",
          reviewNotes: expect.stringContaining("test coverage"),
        },
      });
    });

    it("should not allow contributor to review proof", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/proofs/${proofId}`,
        contributorPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({
            approved: true,
            feedback: "Looks good!",
          }),
        }
      );

      const response = await ReviewProof(request, {
        params: Promise.resolve({ id: bountyId, proofId }),
      });

      expect(response.status).toBe(403);
    });

    it("should not allow viewer to review proof", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/proofs/${proofId}`,
        viewerPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({
            approved: true,
            feedback: "Looks good!",
          }),
        }
      );

      const response = await ReviewProof(request, {
        params: Promise.resolve({ id: bountyId, proofId }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe("Delete Proof", () => {
    let proofId: string;

    beforeEach(async () => {
      const proof = await db.bountyProof.create({
        data: {
          bountyId,
          submittedByPubkey: contributorPubkey,
          proofUrl: "https://github.com/test/repo/pull/123",
          description: "Proof submission that will be deleted in test scenario",
          status: ProofStatus.PENDING,
        },
      });
      proofId = proof.id;
    });

    it("should allow submitter to delete their own proof", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/proofs/${proofId}`,
        contributorPubkey,
        { method: "DELETE" }
      );

      const response = await DeleteProof(request, {
        params: Promise.resolve({ id: bountyId, proofId }),
      });

      expect(response.status).toBe(200);

      // Verify proof is deleted
      const deletedProof = await db.bountyProof.findUnique({
        where: { id: proofId },
      });
      expect(deletedProof).toBeNull();
    });

    it("should allow owner to delete any proof", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/proofs/${proofId}`,
        ownerPubkey,
        { method: "DELETE" }
      );

      const response = await DeleteProof(request, {
        params: Promise.resolve({ id: bountyId, proofId }),
      });

      expect(response.status).toBe(200);
    });

    it("should not allow other users to delete proof", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/proofs/${proofId}`,
        viewerPubkey,
        { method: "DELETE" }
      );

      const response = await DeleteProof(request, {
        params: Promise.resolve({ id: bountyId, proofId }),
      });

      expect(response.status).toBe(403);
    });

    it("should not allow deletion of accepted proofs", async () => {
      // Update proof to accepted
      await db.bountyProof.update({
        where: { id: proofId },
        data: { status: ProofStatus.ACCEPTED },
      });

      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/proofs/${proofId}`,
        contributorPubkey,
        { method: "DELETE" }
      );

      const response = await DeleteProof(request, {
        params: Promise.resolve({ id: bountyId, proofId }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("Full Proof Lifecycle", () => {
    it("should handle complete proof workflow: submit -> reject -> resubmit -> approve -> complete bounty", async () => {
      // Step 1: Submit initial proof
      const submitRequest1 = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/proofs`,
        contributorPubkey,
        {
          method: "POST",
          body: JSON.stringify({
            proofUrl: "https://github.com/test/repo/pull/123",
            description: "Initial implementation with basic features completed",
          }),
        }
      );

      const submitResponse1 = await SubmitProof(submitRequest1, {
        params: Promise.resolve({ id: bountyId }),
      });
      expect(submitResponse1.status).toBe(201);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const submitData1 = (await parseResponse(submitResponse1)) as any;
      const proof1Id = submitData1.data.id;

      // Verify bounty is IN_REVIEW
      const bounty = await db.bounty.findUnique({ where: { id: bountyId } });
      expect(bounty?.status).toBe(BountyStatus.IN_REVIEW);

      // Step 2: Reject proof with feedback
      const rejectRequest = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/proofs/${proof1Id}`,
        ownerPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({
            approved: false,
            feedback: "Please add error handling and improve test coverage significantly",
          }),
        }
      );

      const rejectResponse = await ReviewProof(rejectRequest, {
        params: Promise.resolve({ id: bountyId, proofId: proof1Id }),
      });
      expect(rejectResponse.status).toBe(200);

      // Step 3: Submit revised proof
      const submitRequest2 = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/proofs`,
        contributorPubkey,
        {
          method: "POST",
          body: JSON.stringify({
            proofUrl: "https://github.com/test/repo/pull/124",
            description:
              "Revised implementation with error handling and comprehensive test coverage",
          }),
        }
      );

      const submitResponse2 = await SubmitProof(submitRequest2, {
        params: Promise.resolve({ id: bountyId }),
      });
      expect(submitResponse2.status).toBe(201);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const submitData2 = (await parseResponse(submitResponse2)) as any;
      const proof2Id = submitData2.data.id;

      // Step 4: Approve proof
      const approveRequest = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/proofs/${proof2Id}`,
        ownerPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({
            approved: true,
            feedback: "Excellent work! All feedback addressed perfectly.",
          }),
        }
      );

      const approveResponse = await ReviewProof(approveRequest, {
        params: Promise.resolve({ id: bountyId, proofId: proof2Id }),
      });
      expect(approveResponse.status).toBe(200);

      // Verify we have 2 proofs (1 rejected, 1 accepted)
      const proofs = await db.bountyProof.findMany({
        where: { bountyId },
      });
      expect(proofs).toHaveLength(2);
      expect(proofs.find((p) => p.id === proof1Id)?.status).toBe(ProofStatus.REJECTED);
      expect(proofs.find((p) => p.id === proof2Id)?.status).toBe(ProofStatus.ACCEPTED);

      // Verify activities logged
      const activities = await db.bountyActivity.findMany({
        where: { bountyId },
        orderBy: { timestamp: "asc" },
      });

      // Verify at least the proof submissions were logged
      expect(activities.length).toBeGreaterThanOrEqual(2);
      const submittedActivities = activities.filter(
        (a) => a.action === BountyActivityAction.PROOF_SUBMITTED
      );
      expect(submittedActivities.length).toBeGreaterThanOrEqual(2); // Both proofs submitted
    });
  });
});
