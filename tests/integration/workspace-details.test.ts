import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { GET, PATCH, DELETE } from "@/app/api/workspaces/[id]/route";
import {
  connectTestDb,
  disconnectTestDb,
  generateTestPubkey,
  createTestUser,
  createTestWorkspace,
  cleanupTestUsers,
} from "../utils/test-db";
import { createNextRequest } from "../utils/test-api";
import { WorkspaceRole } from "@prisma/client";

describe("Workspace Details Integration", () => {
  const ownerPubkey = generateTestPubkey("a0a0");
  const adminPubkey = generateTestPubkey("b1b1");
  const memberPubkey = generateTestPubkey("c2c2");
  const outsiderPubkey = generateTestPubkey("d3d3");
  let workspaceId: string;

  beforeAll(async () => {
    await connectTestDb();
    await createTestUser({ pubkey: ownerPubkey });
    await createTestUser({ pubkey: adminPubkey });
    await createTestUser({ pubkey: memberPubkey });
    await createTestUser({ pubkey: outsiderPubkey });

    const { workspace } = await createTestWorkspace({
      ownerPubkey,
      name: "Test Workspace",
      description: "Test description",
    });
    workspaceId = workspace.id;
  });

  afterAll(async () => {
    await cleanupTestUsers([ownerPubkey, adminPubkey, memberPubkey, outsiderPubkey]);
    await disconnectTestDb();
  });

  describe("GET /api/workspaces/[id]", () => {
    it("returns workspace details with full relations", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}`, {
        method: "GET",
        headers: { "x-user-pubkey": ownerPubkey },
      });

      const response = await GET(request, { params: Promise.resolve({ id: workspaceId }) });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.data.workspace).toMatchObject({
        id: workspaceId,
        name: "Test Workspace",
        description: "Test description",
        role: WorkspaceRole.OWNER,
        memberCount: 1,
        bountyCount: 0,
      });
      expect(result.data.workspace.budget).toBeDefined();
      expect(result.data.workspace.members).toHaveLength(1);
      expect(result.data.workspace.members[0].user).toBeDefined();
    });

    it("requires authentication", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}`, {
        method: "GET",
      });

      const response = await GET(request, { params: Promise.resolve({ id: workspaceId }) });
      expect(response.status).toBe(401);
    });

    it("returns 404 for non-member", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}`, {
        method: "GET",
        headers: { "x-user-pubkey": outsiderPubkey },
      });

      const response = await GET(request, { params: Promise.resolve({ id: workspaceId }) });
      expect(response.status).toBe(404);
    });

    it("returns 404 for non-existent workspace", async () => {
      const request = createNextRequest("http://localhost/api/workspaces/cm123456789", {
        method: "GET",
        headers: { "x-user-pubkey": ownerPubkey },
      });

      const response = await GET(request, { params: Promise.resolve({ id: "cm123456789" }) });
      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /api/workspaces/[id]", () => {
    it("updates workspace as owner", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "x-user-pubkey": ownerPubkey },
        body: JSON.stringify({
          name: "Updated Workspace",
          description: "Updated description",
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: workspaceId }) });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.data.workspace.name).toBe("Updated Workspace");
      expect(result.data.workspace.description).toBe("Updated description");
    });

    it("allows partial updates", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "x-user-pubkey": ownerPubkey },
        body: JSON.stringify({
          mission: "New mission statement for the workspace",
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: workspaceId }) });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.data.workspace.mission).toBe("New mission statement for the workspace");
      expect(result.data.workspace.name).toBe("Updated Workspace");
    });

    it("requires authentication", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: "Hacked" }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: workspaceId }) });
      expect(response.status).toBe(401);
    });

    it("prevents non-members from updating", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "x-user-pubkey": outsiderPubkey },
        body: JSON.stringify({ name: "Hacked" }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: workspaceId }) });
      expect(response.status).toBe(404);
    });

    it("validates request body", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "x-user-pubkey": ownerPubkey },
        body: JSON.stringify({
          name: "AB",
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: workspaceId }) });
      expect(response.status).toBe(422);
    });

    it("prevents duplicate workspace names", async () => {
      await createTestWorkspace({
        ownerPubkey,
        name: "Another Workspace",
      });

      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "x-user-pubkey": ownerPubkey },
        body: JSON.stringify({
          name: "Another Workspace",
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: workspaceId }) });
      expect(response.status).toBe(409);
    });
  });

  describe("DELETE /api/workspaces/[id]", () => {
    it("soft deletes workspace as owner", async () => {
      const { workspace: deleteWorkspace } = await createTestWorkspace({
        ownerPubkey,
        name: "To Delete Workspace",
      });

      const request = createNextRequest(`http://localhost/api/workspaces/${deleteWorkspace.id}`, {
        method: "DELETE",
        headers: { "x-user-pubkey": ownerPubkey },
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: deleteWorkspace.id }),
      });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.data.message).toBe("Workspace deleted successfully");

      const getRequest = createNextRequest(
        `http://localhost/api/workspaces/${deleteWorkspace.id}`,
        {
          method: "GET",
          headers: { "x-user-pubkey": ownerPubkey },
        }
      );

      const getResponse = await GET(getRequest, {
        params: Promise.resolve({ id: deleteWorkspace.id }),
      });
      expect(getResponse.status).toBe(404);
    });

    it("requires authentication", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}`, {
        method: "DELETE",
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: workspaceId }) });
      expect(response.status).toBe(401);
    });

    it("prevents non-owners from deleting", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}`, {
        method: "DELETE",
        headers: { "x-user-pubkey": outsiderPubkey },
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: workspaceId }) });
      expect(response.status).toBe(404);
    });

    it("returns 404 for non-existent workspace", async () => {
      const request = createNextRequest("http://localhost/api/workspaces/cm123456789", {
        method: "DELETE",
        headers: { "x-user-pubkey": ownerPubkey },
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: "cm123456789" }) });
      expect(response.status).toBe(404);
    });
  });
});
