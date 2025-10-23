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
import { PATCH as UnclaimPatch } from "@/app/api/workspaces/[id]/bounties/[bountyId]/unclaim/route";

describe("Workspace Bounty Unclaim Tests", () => {
  const ownerPubkey = generateTestPubkey("unclaim_owner");
  const contributorPubkey = generateTestPubkey("unclaim_contrib");
  const adminPubkey = generateTestPubkey("unclaim_admin");
  const otherContributorPubkey = generateTestPubkey("unclaim_other");

  let workspaceId: string;
  let bountyId: string;

  beforeAll(async () => {
    await connectTestDb();
    await cleanupTestUsers([ownerPubkey, contributorPubkey, adminPubkey, otherContributorPubkey]);

    const suffix = Date.now().toString().slice(-6);
    await createTestUser({ pubkey: ownerPubkey, username: `unown-${suffix}` });
    await createTestUser({ pubkey: contributorPubkey, username: `uncon-${suffix}` });
    await createTestUser({ pubkey: adminPubkey, username: `unadm-${suffix}` });
    await createTestUser({ pubkey: otherContributorPubkey, username: `unoth-${suffix}` });
  });

  afterAll(async () => {
    await cleanupTestUsers([ownerPubkey, contributorPubkey, adminPubkey, otherContributorPubkey]);
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
      userPubkey: otherContributorPubkey,
      role: WorkspaceRole.CONTRIBUTOR,
    });

    const bounty = await createTestBounty({
      workspaceId,
      creatorPubkey: ownerPubkey,
      title: "Test Bounty for Unclaims",
      amount: 5000,
      status: BountyStatus.ASSIGNED,
      assigneePubkey: contributorPubkey,
    });
    bountyId = bounty.id;

    await db.bounty.update({
      where: { id: bountyId },
      data: { assignedAt: new Date() },
    });
  });

  it("should allow assignee to unclaim their bounty", async () => {
    const request = createAuthedRequest(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/unclaim`,
      contributorPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({
          reason: "I need more time to complete this task",
        }),
      }
    );

    const response = await UnclaimPatch(request, {
      params: Promise.resolve({ id: workspaceId, bountyId }),
    });

    expect(response.status).toBe(200);

    const data = await parseResponse(response);
    expect(data).toMatchObject({
      success: true,
      data: {
        message: expect.stringContaining("unclaimed"),
      },
    });

    const updatedBounty = await db.bounty.findUnique({
      where: { id: bountyId },
    });

    expect(updatedBounty?.status).toBe(BountyStatus.OPEN);
    expect(updatedBounty?.assigneePubkey).toBeNull();
    expect(updatedBounty?.assignedAt).toBeNull();

    const activity = await db.bountyActivity.findFirst({
      where: {
        bountyId,
        action: BountyActivityAction.UNASSIGNED,
      },
    });

    expect(activity).toBeTruthy();
    expect(activity?.userPubkey).toBe(contributorPubkey);
  });

  it("should allow admin to unclaim any bounty", async () => {
    const request = createAuthedRequest(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/unclaim`,
      adminPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({
          reason: "Admin force unclaim for reassignment",
        }),
      }
    );

    const response = await UnclaimPatch(request, {
      params: Promise.resolve({ id: workspaceId, bountyId }),
    });

    expect(response.status).toBe(200);

    const data = await parseResponse(response);
    expect(data).toMatchObject({
      success: true,
      data: {
        message: expect.stringContaining("unclaimed"),
      },
    });

    const updatedBounty = await db.bounty.findUnique({
      where: { id: bountyId },
    });

    expect(updatedBounty?.status).toBe(BountyStatus.OPEN);
    expect(updatedBounty?.assigneePubkey).toBeNull();

    const activity = await db.bountyActivity.findFirst({
      where: {
        bountyId,
        action: BountyActivityAction.UNASSIGNED,
      },
    });

    expect(activity?.userPubkey).toBe(adminPubkey);
  });

  it("should allow owner to unclaim any bounty", async () => {
    const request = createAuthedRequest(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/unclaim`,
      ownerPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({
          reason: "Owner force unclaim for reassignment",
        }),
      }
    );

    const response = await UnclaimPatch(request, {
      params: Promise.resolve({ id: workspaceId, bountyId }),
    });

    expect(response.status).toBe(200);

    const updatedBounty = await db.bounty.findUnique({
      where: { id: bountyId },
    });

    expect(updatedBounty?.assigneePubkey).toBeNull();
  });

  it("should fail if non-admin tries to unclaim someone else's bounty", async () => {
    const request = createAuthedRequest(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/unclaim`,
      otherContributorPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({
          reason: "Trying to unclaim someone else's bounty",
        }),
      }
    );

    const response = await UnclaimPatch(request, {
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

  it("should fail if bounty not assigned", async () => {
    await db.bounty.update({
      where: { id: bountyId },
      data: {
        status: BountyStatus.OPEN,
        assigneePubkey: null,
        assignedAt: null,
      },
    });

    const request = createAuthedRequest(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/unclaim`,
      contributorPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({
          reason: "Trying to unclaim unassigned bounty",
        }),
      }
    );

    const response = await UnclaimPatch(request, {
      params: Promise.resolve({ id: workspaceId, bountyId }),
    });

    expect(response.status).toBe(400);

    const data = await parseResponse(response);
    expect(data).toMatchObject({
      success: false,
      error: {
        code: "INVALID_STATE",
      },
    });
  });

  it("should fail if bounty in review", async () => {
    await db.bounty.update({
      where: { id: bountyId },
      data: {
        status: BountyStatus.IN_REVIEW,
      },
    });

    const request = createAuthedRequest(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/unclaim`,
      contributorPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({
          reason: "Trying to unclaim bounty in review",
        }),
      }
    );

    const response = await UnclaimPatch(request, {
      params: Promise.resolve({ id: workspaceId, bountyId }),
    });

    expect(response.status).toBe(400);

    const data = await parseResponse(response);
    expect(data).toMatchObject({
      success: false,
      error: {
        code: "INVALID_STATE",
      },
    });
  });

  it("should fail without authentication", async () => {
    const request = new Request(
      `http://localhost/api/workspaces/${workspaceId}/bounties/${bountyId}/unclaim`,
      {
        method: "PATCH",
        body: JSON.stringify({
          reason: "Trying to unclaim without auth",
        }),
      }
    );

    const response = await UnclaimPatch(request as any, {
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
      `http://localhost/api/workspaces/${workspaceId}/bounties/${fakeBountyId}/unclaim`,
      contributorPubkey,
      {
        method: "PATCH",
        body: JSON.stringify({
          reason: "Trying to unclaim non-existent bounty",
        }),
      }
    );

    const response = await UnclaimPatch(request, {
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
