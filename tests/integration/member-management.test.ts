import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { GET, POST } from "@/app/api/workspaces/[id]/members/route";
import { PATCH, DELETE } from "@/app/api/workspaces/[id]/members/[pubkey]/route";
import {
  connectTestDb,
  disconnectTestDb,
  generateTestPubkey,
  createTestUser,
  createTestWorkspace,
  cleanupTestUsers,
  addWorkspaceMember,
} from "../utils/test-db";
import { createNextRequest } from "../utils/test-api";
import { WorkspaceRole } from "@prisma/client";
import { db } from "@/lib/db";

describe("Member Management Integration", () => {
  const ownerPubkey = generateTestPubkey("00aa");
  const adminPubkey = generateTestPubkey("01bb");
  const contributorPubkey = generateTestPubkey("02cc");
  const newUserPubkey = generateTestPubkey("03dd");
  const anotherPubkey = generateTestPubkey("04ee");
  const outsiderPubkey = generateTestPubkey("05ff");
  let workspaceId: string;

  beforeAll(async () => {
    await connectTestDb();
    await createTestUser({ pubkey: ownerPubkey });
    await createTestUser({ pubkey: adminPubkey });
    await createTestUser({ pubkey: contributorPubkey });
    await createTestUser({ pubkey: newUserPubkey });
    await createTestUser({ pubkey: anotherPubkey });
    await createTestUser({ pubkey: outsiderPubkey });

    const { workspace } = await createTestWorkspace({
      ownerPubkey,
      name: `Member Test Workspace ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    });
    workspaceId = workspace.id;

    await addWorkspaceMember({
      workspaceId,
      userPubkey: adminPubkey,
      role: WorkspaceRole.ADMIN,
    });

    await addWorkspaceMember({
      workspaceId,
      userPubkey: contributorPubkey,
      role: WorkspaceRole.CONTRIBUTOR,
    });
  });

  afterAll(async () => {
    await cleanupTestUsers([
      ownerPubkey,
      adminPubkey,
      contributorPubkey,
      newUserPubkey,
      anotherPubkey,
      outsiderPubkey,
    ]);
    await disconnectTestDb();
  });

  describe("GET /api/workspaces/[id]/members", () => {
    it("lists all workspace members", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}/members`, {
        method: "GET",
        headers: { "x-user-pubkey": ownerPubkey },
      });

      const response = await GET(request, { params: Promise.resolve({ id: workspaceId }) });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.data.members).toHaveLength(3);
      expect(result.data.members[0].role).toBe(WorkspaceRole.OWNER);
      expect(result.data.members[0].user).toBeDefined();
    });

    it("requires authentication", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}/members`, {
        method: "GET",
      });

      const response = await GET(request, { params: Promise.resolve({ id: workspaceId }) });
      expect(response.status).toBe(401);
    });

    it("requires membership to view members", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}/members`, {
        method: "GET",
        headers: { "x-user-pubkey": outsiderPubkey },
      });

      const response = await GET(request, { params: Promise.resolve({ id: workspaceId }) });
      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/workspaces/[id]/members", () => {
    it("adds member as owner", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "x-user-pubkey": ownerPubkey },
        body: JSON.stringify({
          userPubkey: newUserPubkey,
          role: WorkspaceRole.CONTRIBUTOR,
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: workspaceId }) });
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.data.member.userPubkey).toBe(newUserPubkey);
      expect(result.data.member.role).toBe(WorkspaceRole.CONTRIBUTOR);
      expect(result.data.member.user).toBeDefined();
    });

    it("adds member as admin", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "x-user-pubkey": adminPubkey },
        body: JSON.stringify({
          userPubkey: anotherPubkey,
          role: WorkspaceRole.CONTRIBUTOR,
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: workspaceId }) });
      expect(response.status).toBe(201);
    });

    it("prevents non-admin from adding members", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "x-user-pubkey": contributorPubkey },
        body: JSON.stringify({
          userPubkey: outsiderPubkey,
          role: WorkspaceRole.CONTRIBUTOR,
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: workspaceId }) });
      expect(response.status).toBe(403);
    });

    it("prevents adding non-existent user", async () => {
      // Generate a fake pubkey that doesn't exist in the database
      const fakePubkey = generateTestPubkey("ffff");
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "x-user-pubkey": ownerPubkey },
        body: JSON.stringify({
          userPubkey: fakePubkey,
          role: WorkspaceRole.CONTRIBUTOR,
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: workspaceId }) });
      expect(response.status).toBe(404);
    });

    it("prevents adding duplicate member", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "x-user-pubkey": ownerPubkey },
        body: JSON.stringify({
          userPubkey: contributorPubkey,
          role: WorkspaceRole.CONTRIBUTOR,
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: workspaceId }) });
      expect(response.status).toBe(409);
    });

    it("validates request body", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "x-user-pubkey": ownerPubkey },
        body: JSON.stringify({
          userPubkey: "invalid",
          role: WorkspaceRole.CONTRIBUTOR,
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: workspaceId }) });
      expect(response.status).toBe(422);
    });

    it("requires authentication", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        body: JSON.stringify({
          userPubkey: outsiderPubkey,
          role: WorkspaceRole.CONTRIBUTOR,
        }),
      });

      const response = await POST(request, { params: Promise.resolve({ id: workspaceId }) });
      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /api/workspaces/[id]/members/[pubkey]", () => {
    it("updates member role as owner", async () => {
      await db.workspaceMember.update({
        where: {
          workspaceId_userPubkey: {
            workspaceId,
            userPubkey: contributorPubkey,
          },
        },
        data: { role: WorkspaceRole.CONTRIBUTOR },
      });

      const request = createNextRequest(
        `http://localhost/api/workspaces/${workspaceId}/members/${contributorPubkey}`,
        {
          method: "PATCH",
          headers: { "x-user-pubkey": ownerPubkey },
          body: JSON.stringify({
            role: WorkspaceRole.ADMIN,
          }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: workspaceId, pubkey: contributorPubkey }),
      });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.data.member.role).toBe(WorkspaceRole.ADMIN);
    });

    it("prevents removing last owner", async () => {
      const request = createNextRequest(
        `http://localhost/api/workspaces/${workspaceId}/members/${ownerPubkey}`,
        {
          method: "PATCH",
          headers: { "x-user-pubkey": ownerPubkey },
          body: JSON.stringify({
            role: WorkspaceRole.ADMIN,
          }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: workspaceId, pubkey: ownerPubkey }),
      });
      expect(response.status).toBe(400);
    });

    it("prevents non-admin from updating roles", async () => {
      const request = createNextRequest(
        `http://localhost/api/workspaces/${workspaceId}/members/${adminPubkey}`,
        {
          method: "PATCH",
          headers: { "x-user-pubkey": newUserPubkey },
          body: JSON.stringify({
            role: WorkspaceRole.OWNER,
          }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: workspaceId, pubkey: adminPubkey }),
      });
      expect(response.status).toBe(403);
    });

    it("returns 404 for non-existent member", async () => {
      const request = createNextRequest(
        `http://localhost/api/workspaces/${workspaceId}/members/${outsiderPubkey}`,
        {
          method: "PATCH",
          headers: { "x-user-pubkey": ownerPubkey },
          body: JSON.stringify({
            role: WorkspaceRole.CONTRIBUTOR,
          }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: workspaceId, pubkey: outsiderPubkey }),
      });
      expect(response.status).toBe(404);
    });

    it("requires authentication", async () => {
      const request = createNextRequest(
        `http://localhost/api/workspaces/${workspaceId}/members/${contributorPubkey}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            role: WorkspaceRole.OWNER,
          }),
        }
      );

      const response = await PATCH(request, {
        params: Promise.resolve({ id: workspaceId, pubkey: contributorPubkey }),
      });
      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /api/workspaces/[id]/members/[pubkey]", () => {
    it("removes member as owner", async () => {
      const request = createNextRequest(
        `http://localhost/api/workspaces/${workspaceId}/members/${contributorPubkey}`,
        {
          method: "DELETE",
          headers: { "x-user-pubkey": ownerPubkey },
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: workspaceId, pubkey: contributorPubkey }),
      });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.data.message).toBe("Member removed successfully");

      const removedMember = await db.workspaceMember.findUnique({
        where: {
          workspaceId_userPubkey: {
            workspaceId,
            userPubkey: contributorPubkey,
          },
        },
      });
      expect(removedMember).toBeNull();
    });

    it("prevents removing last owner", async () => {
      const request = createNextRequest(
        `http://localhost/api/workspaces/${workspaceId}/members/${ownerPubkey}`,
        {
          method: "DELETE",
          headers: { "x-user-pubkey": ownerPubkey },
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: workspaceId, pubkey: ownerPubkey }),
      });
      expect(response.status).toBe(400);
    });

    it("prevents non-admin from removing members", async () => {
      // Ensure newUserPubkey is a member (may already exist from earlier test)
      const existing = await db.workspaceMember.findUnique({
        where: {
          workspaceId_userPubkey: {
            workspaceId,
            userPubkey: newUserPubkey,
          },
        },
      });

      if (!existing) {
        await addWorkspaceMember({
          workspaceId,
          userPubkey: newUserPubkey,
          role: WorkspaceRole.CONTRIBUTOR,
        });
      }

      const request = createNextRequest(
        `http://localhost/api/workspaces/${workspaceId}/members/${adminPubkey}`,
        {
          method: "DELETE",
          headers: { "x-user-pubkey": newUserPubkey },
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: workspaceId, pubkey: adminPubkey }),
      });
      expect(response.status).toBe(403);
    });

    it("returns 404 for non-existent member", async () => {
      const request = createNextRequest(
        `http://localhost/api/workspaces/${workspaceId}/members/${outsiderPubkey}`,
        {
          method: "DELETE",
          headers: { "x-user-pubkey": ownerPubkey },
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: workspaceId, pubkey: outsiderPubkey }),
      });
      expect(response.status).toBe(404);
    });

    it("requires authentication", async () => {
      const request = createNextRequest(
        `http://localhost/api/workspaces/${workspaceId}/members/${contributorPubkey}`,
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request, {
        params: Promise.resolve({ id: workspaceId, pubkey: contributorPubkey }),
      });
      expect(response.status).toBe(401);
    });
  });
});
