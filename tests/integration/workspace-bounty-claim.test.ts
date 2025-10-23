/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { BountyStatus, WorkspaceRole, BountyActivityAction } from "@prisma/client";
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
import { PATCH as ClaimPatch } from "@/app/api/workspaces/[id]/bounties/[bountyId]/claim/route";

describe("Workspace Bounty Claim Tests", () => {
  const ownerPubkey = generateTestPubkey("claim_owner");
  const contributorPubkey = generateTestPubkey("claim_contrib");
  const adminPubkey = generateTestPubkey("claim_admin");
  const viewerPubkey = generateTestPubkey("claim_viewer");
  const otherUserPubkey = generateTestPubkey("claim_other");

  let workspaceId: string;
  let bountyId: string;

  beforeAll(async () => {
    await connectTestDb();
    await cleanupTestUsers([
      ownerPubkey,
      contributorPubkey,
      adminPubkey,
      viewerPubkey,
      otherUserPubkey,
    ]);

    const suffix = Date.now().toString().slice(-6);
    await createTestUser({ pubkey: ownerPubkey, username: `clmown-${suffix}` });
    await createTestUser({ pubkey: contributorPubkey, username: `clmcon-${suffix}` });
    await createTestUser({ pubkey: adminPubkey, username: `clmadm-${suffix}` });
    await createTestUser({ pubkey: viewerPubkey, username: `clmvw-${suffix}` });
    await createTestUser({ pubkey: otherUserPubkey, username: `clmoth-${suffix}` });
  });

  afterAll(async () => {
    await cleanupTestUsers([
      ownerPubkey,
      contributorPubkey,
      adminPubkey,
      viewerPubkey,
      otherUserPubkey,
    ]);
    await disconnectTestDb();
  });

  beforeEach(async () => {
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

    await addWorkspaceMember({
      workspaceId,
      userPubkey: viewerPubkey,
      role: WorkspaceRole.VIEWER,
    });

    const bounty = await createTestBounty({
      workspaceId,
      creatorPubkey: ownerPubkey,
      title: "Test Bounty for Claims",
      amount: 5000,
      status: BountyStatus.OPEN,
    });
    bountyId = bounty.id;
  });

  it("should allow contributor to claim open bounty", async () => {
    const request = createAuthedRequest(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/claim`,
      contributorPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({
          message: "I'd like to work on this bounty",
        }),
      }
    );

    const response = await ClaimPatch(request, {
      params: Promise.resolve({ id: workspaceId, bountyId }),
    });

    expect(response.status).toBe(200);

    const data = await parseResponse(response);
    expect(data).toMatchObject({
      success: true,
      data: {
        message: expect.stringContaining("claimed"),
      },
    });

    const updatedBounty = await db.bounty.findUnique({
      where: { id: bountyId },
    });

    expect(updatedBounty?.status).toBe(BountyStatus.ASSIGNED);
    expect(updatedBounty?.assigneePubkey).toBe(contributorPubkey);
    expect(updatedBounty?.assignedAt).toBeTruthy();

    const activity = await db.bountyActivity.findFirst({
      where: {
        bountyId,
        action: BountyActivityAction.ASSIGNED,
      },
    });

    expect(activity).toBeTruthy();
    expect(activity?.userPubkey).toBe(contributorPubkey);
  });

  it("should allow owner to claim bounty", async () => {
    const request = createAuthedRequest(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/claim`,
      ownerPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({}),
      }
    );

    const response = await ClaimPatch(request, {
      params: Promise.resolve({ id: workspaceId, bountyId }),
    });

    expect(response.status).toBe(200);

    const data = await parseResponse(response);
    expect(data).toMatchObject({
      success: true,
      data: {
        message: expect.stringContaining("claimed"),
      },
    });

    const updatedBounty = await db.bounty.findUnique({
      where: { id: bountyId },
    });

    expect(updatedBounty?.status).toBe(BountyStatus.ASSIGNED);
    expect(updatedBounty?.assigneePubkey).toBe(ownerPubkey);
  });

  it("should allow admin to claim bounty", async () => {
    const request = createAuthedRequest(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/claim`,
      adminPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({}),
      }
    );

    const response = await ClaimPatch(request, {
      params: Promise.resolve({ id: workspaceId, bountyId }),
    });

    expect(response.status).toBe(200);

    const updatedBounty = await db.bounty.findUnique({
      where: { id: bountyId },
    });

    expect(updatedBounty?.assigneePubkey).toBe(adminPubkey);
  });

  it("should fail if bounty already assigned", async () => {
    await db.bounty.update({
      where: { id: bountyId },
      data: {
        status: BountyStatus.ASSIGNED,
        assigneePubkey: viewerPubkey,
        assignedAt: new Date(),
      },
    });

    const request = createAuthedRequest(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/claim`,
      contributorPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({}),
      }
    );

    const response = await ClaimPatch(request, {
      params: Promise.resolve({ id: workspaceId, bountyId }),
    });

    expect(response.status).toBe(400);

    const data = await parseResponse(response);
    expect(data).toMatchObject({
      success: false,
      error: {
        code: "BOUNTY_ALREADY_ASSIGNED",
      },
    });
  });

  it("should fail if bounty is completed", async () => {
    await db.bounty.update({
      where: { id: bountyId },
      data: {
        status: BountyStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    const request = createAuthedRequest(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/claim`,
      contributorPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({}),
      }
    );

    const response = await ClaimPatch(request, {
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

  it("should fail if bounty is cancelled", async () => {
    await db.bounty.update({
      where: { id: bountyId },
      data: {
        status: BountyStatus.CANCELLED,
      },
    });

    const request = createAuthedRequest(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/claim`,
      contributorPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({}),
      }
    );

    const response = await ClaimPatch(request, {
      params: Promise.resolve({ id: workspaceId, bountyId }),
    });

    expect(response.status).toBe(400);
  });

  it("should fail if user not workspace member", async () => {
    const request = createAuthedRequest(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/claim`,
      otherUserPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({}),
      }
    );

    const response = await ClaimPatch(request, {
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

  it("should fail if viewer tries to claim", async () => {
    const request = createAuthedRequest(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/claim`,
      viewerPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({}),
      }
    );

    const response = await ClaimPatch(request, {
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

  it("should fail without authentication", async () => {
    const request = new Request(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/claim`,
      {
        method: "PATCH",
        body: JSON.stringify({}),
      }
    );

    const response = await ClaimPatch(request as any, {
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

  it("should fail for non-existent bounty", async () => {
    const fakeBountyId = "00000000-0000-0000-0000-000000000000";

    const request = createAuthedRequest(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${fakeBountyId}/claim`,
      contributorPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({}),
      }
    );

    const response = await ClaimPatch(request, {
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

  it("should fail for non-existent workspace", async () => {
    const fakeWorkspaceId = "00000000-0000-0000-0000-000000000000";

    const request = createAuthedRequest(
      `http://localhost/api/workspaces/${fakeWorkspaceId}/bounties/${bountyId}/claim`,
      contributorPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({}),
      }
    );

    const response = await ClaimPatch(request, {
      params: Promise.resolve({ id: fakeWorkspaceId, bountyId }),
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
});
