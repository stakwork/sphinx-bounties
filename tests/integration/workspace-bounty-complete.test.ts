/* eslint-disable @typescript-eslint/no-explicit-any */

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
import { PATCH as CompletePatch } from "@/app/api/workspaces/[id]/bounties/[bountyId]/complete/route";

describe("Workspace Bounty Complete Tests", () => {
  const ownerPubkey = generateTestPubkey("complete_owner");
  const contributorPubkey = generateTestPubkey("complete_contrib");
  const adminPubkey = generateTestPubkey("complete_admin");
  const otherUserPubkey = generateTestPubkey("complete_other");

  let workspaceId: string;
  let bountyId: string;

  beforeAll(async () => {
    await connectTestDb();
    await cleanupTestUsers([ownerPubkey, contributorPubkey, adminPubkey, otherUserPubkey]);

    const suffix = Date.now().toString().slice(-6);
    await createTestUser({ pubkey: ownerPubkey, username: `cmown-${suffix}` });
    await createTestUser({ pubkey: contributorPubkey, username: `cmcon-${suffix}` });
    await createTestUser({ pubkey: adminPubkey, username: `cmadm-${suffix}` });
    await createTestUser({ pubkey: otherUserPubkey, username: `cmoth-${suffix}` });
  });

  afterAll(async () => {
    await cleanupTestUsers([ownerPubkey, contributorPubkey, adminPubkey, otherUserPubkey]);
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await db.bountyProof.deleteMany({
      where: {
        bounty: {
          workspace: {
            ownerPubkey: { in: [ownerPubkey, contributorPubkey, adminPubkey] },
          },
        },
      },
    });

    await db.bountyActivity.deleteMany({
      where: {
        bounty: {
          workspace: {
            ownerPubkey: { in: [ownerPubkey, contributorPubkey, adminPubkey] },
          },
        },
      },
    });

    await db.bounty.deleteMany({
      where: {
        workspace: {
          ownerPubkey: { in: [ownerPubkey, contributorPubkey, adminPubkey] },
        },
      },
    });

    await db.workspaceMember.deleteMany({
      where: {
        workspace: {
          ownerPubkey: { in: [ownerPubkey, contributorPubkey, adminPubkey] },
        },
      },
    });

    await db.workspaceBudget.deleteMany({
      where: {
        workspace: {
          ownerPubkey: { in: [ownerPubkey, contributorPubkey, adminPubkey] },
        },
      },
    });

    await db.workspace.deleteMany({
      where: {
        ownerPubkey: { in: [ownerPubkey, contributorPubkey, adminPubkey] },
      },
    });

    const workspace = await createTestWorkspace({
      ownerPubkey,
      name: "Test Workspace",
    });
    workspaceId = workspace.workspace.id;

    await addWorkspaceMember({
      workspaceId,
      userPubkey: contributorPubkey,
      role: WorkspaceRole.CONTRIBUTOR,
    });

    await addWorkspaceMember({
      workspaceId,
      userPubkey: adminPubkey,
      role: WorkspaceRole.ADMIN,
    });

    const bounty = await createTestBounty({
      workspaceId,
      creatorPubkey: ownerPubkey,
      title: "Test Bounty for Completion",
      amount: 5000,
      status: BountyStatus.IN_REVIEW,
      assigneePubkey: contributorPubkey,
    });
    bountyId = bounty.id;

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
      adminPubkey,
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

    const updatedBounty = await db.bounty.findUnique({
      where: { id: bountyId },
    });

    expect(updatedBounty?.status).toBe(BountyStatus.COMPLETED);
    expect(updatedBounty?.completedAt).toBeTruthy();

    const activity = await db.bountyActivity.findFirst({
      where: {
        bountyId,
        action: BountyActivityAction.COMPLETED,
      },
    });

    expect(activity).toBeTruthy();
    expect(activity?.userPubkey).toBe(adminPubkey);
  });

  it("should allow owner to complete bounty", async () => {
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

    const updatedBounty = await db.bounty.findUnique({
      where: { id: bountyId },
    });

    expect(updatedBounty?.status).toBe(BountyStatus.COMPLETED);
    expect(updatedBounty?.completedAt).toBeTruthy();
  });

  it("should fail if contributor tries to complete", async () => {
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

    const data = await parseResponse(response);
    expect(data).toMatchObject({
      success: false,
      error: {
        code: "FORBIDDEN",
      },
    });
  });

  it("should fail if bounty not in review", async () => {
    await db.bounty.update({
      where: { id: bountyId },
      data: {
        status: BountyStatus.ASSIGNED,
      },
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

  it("should fail if bounty already completed", async () => {
    await db.bounty.update({
      where: { id: bountyId },
      data: {
        status: BountyStatus.COMPLETED,
        completedAt: new Date(),
      },
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

  it("should fail without authentication", async () => {
    const request = new Request(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/complete`,
      {
        method: "PATCH",
        body: JSON.stringify({ bountyId }),
      }
    );

    const response = await CompletePatch(request as any, {
      params: Promise.resolve({ id: workspaceId, bountyId }),
    });

    expect(response.status).toBe(401);

    const data = await parseResponse(response);
    expect(data).toMatchObject({
      success: false,
      error: {
        code: "UNAUTHORIZED",
      },
    });
  });

  it("should fail if user not workspace member", async () => {
    const request = createAuthedRequest(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/complete`,
      otherUserPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({ bountyId }),
      }
    );

    const response = await CompletePatch(request, {
      params: Promise.resolve({ id: workspaceId, bountyId }),
    });

    expect(response.status).toBe(403);

    const data = await parseResponse(response);
    expect(data).toMatchObject({
      success: false,
      error: {
        code: "FORBIDDEN",
      },
    });
  });

  it("should fail for non-existent bounty", async () => {
    const fakeBountyId = "00000000-0000-0000-0000-000000000000";

    const request = createAuthedRequest(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${fakeBountyId}/complete`,
      ownerPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({ bountyId: fakeBountyId }),
      }
    );

    const response = await CompletePatch(request, {
      params: Promise.resolve({ id: workspaceId, bountyId: fakeBountyId }),
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
