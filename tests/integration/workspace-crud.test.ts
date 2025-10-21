import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { POST, GET } from "@/app/api/workspaces/route";
import { WorkspaceRole } from "@prisma/client";
import {
  createNextRequest,
  createTestUser,
  cleanupTestUsers,
  connectTestDb,
  disconnectTestDb,
  generateTestPubkey,
} from "../utils";

describe("Workspace CRUD Integration", () => {
  const testPubkey = generateTestPubkey("user1");
  const testPubkey2 = generateTestPubkey("user2");

  beforeAll(async () => {
    await connectTestDb();
    await createTestUser({ pubkey: testPubkey, username: "test1" });
    await createTestUser({ pubkey: testPubkey2, username: "test2" });
  });

  afterAll(async () => {
    await cleanupTestUsers([testPubkey, testPubkey2]);
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await db.workspaceMember.deleteMany({
      where: {
        OR: [{ userPubkey: testPubkey }, { userPubkey: testPubkey2 }],
      },
    });
    await db.workspaceBudget.deleteMany({
      where: {
        workspace: {
          ownerPubkey: { in: [testPubkey, testPubkey2] },
        },
      },
    });
    await db.workspaceActivity.deleteMany({
      where: {
        userPubkey: { in: [testPubkey, testPubkey2] },
      },
    });
    await db.workspace.deleteMany({
      where: {
        ownerPubkey: { in: [testPubkey, testPubkey2] },
      },
    });
  });

  describe("POST /api/workspaces", () => {
    it("creates workspace successfully with transaction", async () => {
      const workspaceName = `test-workspace-${Date.now()}`;
      const request = createNextRequest("http://localhost/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testPubkey,
        },
        body: JSON.stringify({
          name: workspaceName,
          description: "Test workspace description",
          mission: "Test mission statement for workspace",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.workspace.name).toBe(workspaceName);
      expect(data.data.workspace.description).toBe("Test workspace description");
      expect(data.data.workspace.ownerPubkey).toBe(testPubkey);

      expect(data.data.workspace.budget).toBeDefined();
      expect(data.data.workspace.budget.totalBudget).toBe("0");
      expect(data.data.workspace.budget.availableBudget).toBe("0");

      expect(data.data.workspace.role).toBe(WorkspaceRole.OWNER);
      expect(data.data.workspace.memberCount).toBe(1);
      expect(data.data.workspace.bountyCount).toBe(0);

      const workspace = await db.workspace.findUnique({
        where: { id: data.data.workspace.id },
        include: {
          budget: true,
          members: true,
          activities: true,
        },
      });

      expect(workspace).toBeDefined();
      expect(workspace?.budget).toBeDefined();
      expect(workspace?.members).toHaveLength(1);
      expect(workspace?.members[0].role).toBe(WorkspaceRole.OWNER);
      expect(workspace?.activities).toHaveLength(1);
      expect(workspace?.activities[0].action).toBe("SETTINGS_UPDATED");
    });

    it("requires authentication", async () => {
      const request = createNextRequest("http://localhost/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "test-workspace",
          description: "Test description",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("validates request body", async () => {
      const request = createNextRequest("http://localhost/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testPubkey,
        },
        body: JSON.stringify({
          name: "ab",
          description: "short",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details.errors).toBeDefined();
    });

    it("prevents duplicate workspace names", async () => {
      const workspaceName = `unique-workspace-${Date.now()}`;

      const request1 = createNextRequest("http://localhost/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testPubkey,
        },
        body: JSON.stringify({
          name: workspaceName,
          description: "First workspace description",
          mission: "First mission statement for workspace",
        }),
      });

      const response1 = await POST(request1);
      expect(response1.status).toBe(201);

      const request2 = createNextRequest("http://localhost/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testPubkey2,
        },
        body: JSON.stringify({
          name: workspaceName,
          description: "Second workspace description",
          mission: "Second mission statement for workspace",
        }),
      });

      const response2 = await POST(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(409);
      expect(data2.success).toBe(false);
      expect(data2.error.code).toBe("CONFLICT");
    });

    it("rolls back transaction on error", async () => {
      const workspaceName = `rollback-test-${Date.now()}`;

      const initialWorkspaceCount = await db.workspace.count();
      const initialBudgetCount = await db.workspaceBudget.count();
      const initialMemberCount = await db.workspaceMember.count();

      const request = createNextRequest("http://localhost/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": "invalid-pubkey",
        },
        body: JSON.stringify({
          name: workspaceName,
          description: "Test workspace description",
          mission: "Test mission statement for workspace",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(404);

      const finalWorkspaceCount = await db.workspace.count();
      const finalBudgetCount = await db.workspaceBudget.count();
      const finalMemberCount = await db.workspaceMember.count();

      expect(finalWorkspaceCount).toBe(initialWorkspaceCount);
      expect(finalBudgetCount).toBe(initialBudgetCount);
      expect(finalMemberCount).toBe(initialMemberCount);
    });
  });

  describe("GET /api/workspaces", () => {
    beforeEach(async () => {
      const workspace1 = await db.workspace.create({
        data: {
          name: `workspace-alpha-${Date.now()}`,
          description: "Alpha workspace",
          ownerPubkey: testPubkey,
          mission: "Alpha mission statement for testing purposes",
        },
      });

      await db.workspaceBudget.create({
        data: { workspaceId: workspace1.id },
      });

      await db.workspaceMember.create({
        data: {
          workspaceId: workspace1.id,
          userPubkey: testPubkey,
          role: WorkspaceRole.OWNER,
        },
      });

      const workspace2 = await db.workspace.create({
        data: {
          name: `workspace-beta-${Date.now()}`,
          description: "Beta workspace",
          ownerPubkey: testPubkey2,
          mission: "Beta mission statement for testing purposes",
        },
      });

      await db.workspaceBudget.create({
        data: { workspaceId: workspace2.id },
      });

      await db.workspaceMember.create({
        data: {
          workspaceId: workspace2.id,
          userPubkey: testPubkey2,
          role: WorkspaceRole.OWNER,
        },
      });

      await db.workspaceMember.create({
        data: {
          workspaceId: workspace2.id,
          userPubkey: testPubkey,
          role: WorkspaceRole.CONTRIBUTOR,
        },
      });
    });

    it("lists user workspaces with pagination", async () => {
      const request = createNextRequest("http://localhost/api/workspaces?page=1&pageSize=10", {
        method: "GET",
        headers: {
          "x-user-pubkey": testPubkey,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
      expect(data.data.length).toBe(2);
      expect(data.meta.pagination).toBeDefined();
      expect(data.meta.pagination.page).toBe(1);
      expect(data.meta.pagination.pageSize).toBe(10);
      expect(data.meta.pagination.totalCount).toBe(2);
    });

    it("filters workspaces by owned", async () => {
      const request = createNextRequest("http://localhost/api/workspaces?owned=true", {
        method: "GET",
        headers: {
          "x-user-pubkey": testPubkey,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].role).toBe(WorkspaceRole.OWNER);
      expect(data.data[0].ownerPubkey).toBe(testPubkey);
    });

    it("filters workspaces by role", async () => {
      const request = createNextRequest(
        `http://localhost/api/workspaces?role=${WorkspaceRole.CONTRIBUTOR}`,
        {
          method: "GET",
          headers: {
            "x-user-pubkey": testPubkey,
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].role).toBe(WorkspaceRole.CONTRIBUTOR);
    });

    it("searches workspaces by name", async () => {
      const request = createNextRequest("http://localhost/api/workspaces?search=alpha", {
        method: "GET",
        headers: {
          "x-user-pubkey": testPubkey,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.length).toBeGreaterThanOrEqual(1);
      expect(data.data[0].name).toContain("alpha");
    });

    it("includes workspace counts and budget", async () => {
      const request = createNextRequest("http://localhost/api/workspaces", {
        method: "GET",
        headers: {
          "x-user-pubkey": testPubkey,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data[0].memberCount).toBeDefined();
      expect(data.data[0].bountyCount).toBeDefined();
      expect(data.data[0].budget).toBeDefined();
      expect(data.data[0].role).toBeDefined();
      expect(data.data[0].joinedAt).toBeDefined();
    });

    it("requires authentication", async () => {
      const request = createNextRequest("http://localhost/api/workspaces", {
        method: "GET",
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("sorts workspaces correctly", async () => {
      const request = createNextRequest(
        "http://localhost/api/workspaces?sortBy=name&sortOrder=asc",
        {
          method: "GET",
          headers: {
            "x-user-pubkey": testPubkey,
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.length).toBeGreaterThan(0);

      const names = data.data.map((w: { name: string }) => w.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });
  });
});
