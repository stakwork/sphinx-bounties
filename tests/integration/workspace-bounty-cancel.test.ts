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
import { PATCH as CancelPatch } from "@/app/api/workspaces/[id]/bounties/[bountyId]/cancel/route";

describe("Workspace Bounty Cancel Tests", () => {
  const ownerPubkey = generateTestPubkey("cancel_owner");
  const contributorPubkey = generateTestPubkey("cancel_contrib");
  const adminPubkey = generateTestPubkey("cancel_admin");
  const viewerPubkey = generateTestPubkey("cancel_viewer");
  const otherUserPubkey = generateTestPubkey("cancel_other");

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
    await createTestUser({ pubkey: ownerPubkey, username: `cnown-${suffix}` });
    await createTestUser({ pubkey: contributorPubkey, username: `cncon-${suffix}` });
    await createTestUser({ pubkey: adminPubkey, username: `cnadm-${suffix}` });
    await createTestUser({ pubkey: viewerPubkey, username: `cnvw-${suffix}` });
    await createTestUser({ pubkey: otherUserPubkey, username: `cnoth-${suffix}` });
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
      title: "Test Bounty for Cancellation",
      amount: 5000,
      status: BountyStatus.OPEN,
    });
    bountyId = bounty.id;
  });

  it("should allow owner to cancel open bounty", async () => {
    const request = createAuthedRequest(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/cancel`,
      ownerPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({
          bountyId,
          reason: "Requirements changed, no longer needed",
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

    const updatedBounty = await db.bounty.findUnique({
      where: { id: bountyId },
    });

    expect(updatedBounty?.status).toBe(BountyStatus.CANCELLED);

    const activity = await db.bountyActivity.findFirst({
      where: {
        bountyId,
        action: BountyActivityAction.CANCELLED,
      },
    });

    expect(activity).toBeTruthy();
    expect(activity?.userPubkey).toBe(ownerPubkey);
  });

  it("should allow admin to cancel open bounty", async () => {
    const request = createAuthedRequest(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/cancel`,
      adminPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({
          bountyId,
          reason: "Admin cancelling bounty",
        }),
      }
    );

    const response = await CancelPatch(request, {
      params: Promise.resolve({ id: workspaceId, bountyId }),
    });

    expect(response.status).toBe(200);

    const updatedBounty = await db.bounty.findUnique({
      where: { id: bountyId },
    });

    expect(updatedBounty?.status).toBe(BountyStatus.CANCELLED);
  });

  it("should allow admin to cancel assigned bounty", async () => {
    await db.bounty.update({
      where: { id: bountyId },
      data: {
        status: BountyStatus.ASSIGNED,
        assigneePubkey: contributorPubkey,
        assignedAt: new Date(),
      },
    });

    const request = createAuthedRequest(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/cancel`,
      adminPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({
          bountyId,
          reason: "Admin cancelling assigned bounty",
        }),
      }
    );

    const response = await CancelPatch(request, {
      params: Promise.resolve({ id: workspaceId, bountyId }),
    });

    expect(response.status).toBe(200);

    const updatedBounty = await db.bounty.findUnique({
      where: { id: bountyId },
    });

    expect(updatedBounty?.status).toBe(BountyStatus.CANCELLED);
  });

  it("should allow creator to cancel their bounty", async () => {
    const creatorBounty = await createTestBounty({
      workspaceId,
      creatorPubkey: contributorPubkey,
      title: "Contributor created bounty",
      amount: 3000,
      status: BountyStatus.OPEN,
    });

    const request = createAuthedRequest(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${creatorBounty.id}/cancel`,
      contributorPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({
          bountyId: creatorBounty.id,
          reason: "Creator cancelling their own bounty",
        }),
      }
    );

    const response = await CancelPatch(request, {
      params: Promise.resolve({ id: workspaceId, bountyId: creatorBounty.id }),
    });

    expect(response.status).toBe(200);

    const updatedBounty = await db.bounty.findUnique({
      where: { id: creatorBounty.id },
    });

    expect(updatedBounty?.status).toBe(BountyStatus.CANCELLED);
  });

  it("should fail if non-admin/non-creator contributor tries to cancel", async () => {
    const request = createAuthedRequest(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/cancel`,
      contributorPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({
          bountyId,
          reason: "Trying to cancel someone else's bounty",
        }),
      }
    );

    const response = await CancelPatch(request, {
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

  it("should fail if bounty already completed", async () => {
    await db.bounty.update({
      where: { id: bountyId },
      data: {
        status: BountyStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    const request = createAuthedRequest(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/cancel`,
      ownerPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({
          bountyId,
          reason: "Trying to cancel completed bounty",
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

  it("should allow cancelling already cancelled bounty (idempotent)", async () => {
    await db.bounty.update({
      where: { id: bountyId },
      data: {
        status: BountyStatus.CANCELLED,
      },
    });

    const request = createAuthedRequest(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/cancel`,
      ownerPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({
          bountyId,
          reason: "Cancelling already cancelled bounty",
        }),
      }
    );

    const response = await CancelPatch(request, {
      params: Promise.resolve({ id: workspaceId, bountyId }),
    });

    expect(response.status).toBe(200);

    const updatedBounty = await db.bounty.findUnique({
      where: { id: bountyId },
    });

    expect(updatedBounty?.status).toBe(BountyStatus.CANCELLED);
  });

  it("should fail without authentication", async () => {
    const request = new Request(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/cancel`,
      {
        method: "PATCH",
        body: JSON.stringify({
          bountyId,
          reason: "Trying to cancel without auth",
        }),
      }
    );

    const response = await CancelPatch(request as any, {
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
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/cancel`,
      otherUserPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({
          bountyId,
          reason: "Trying to cancel from outside workspace",
        }),
      }
    );

    const response = await CancelPatch(request, {
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
      `http://localhost/api/workspaces/${workspaceId}/bounties/${fakeBountyId}/cancel`,
      ownerPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({
          bountyId: fakeBountyId,
          reason: "Trying to cancel non-existent bounty",
        }),
      }
    );

    const response = await CancelPatch(request, {
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
