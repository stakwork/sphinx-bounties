import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { POST as POST_BUDGET } from "@/app/api/workspaces/[id]/budget/route";
import { GET as GET_TRANSACTIONS } from "@/app/api/workspaces/[id]/transactions/route";
import { GET as GET_ACTIVITIES } from "@/app/api/workspaces/[id]/activities/route";
import {
  connectTestDb,
  disconnectTestDb,
  generateTestPubkey,
  createTestUser,
  createTestWorkspace,
  cleanupTestUsers,
  addWorkspaceMember,
  createNextRequest,
} from "../utils";
import { WorkspaceRole, TransactionType, WorkspaceActivityAction } from "@prisma/client";
import { db } from "@/lib/db";

describe("Budget, Transactions & Activities Integration", () => {
  const ownerPubkey = generateTestPubkey("aa00");
  const adminPubkey = generateTestPubkey("bb11");
  const contributorPubkey = generateTestPubkey("cc22");
  const outsiderPubkey = generateTestPubkey("dd33");
  let workspaceId: string;

  beforeAll(async () => {
    await connectTestDb();
    await createTestUser({ pubkey: ownerPubkey });
    await createTestUser({ pubkey: adminPubkey });
    await createTestUser({ pubkey: contributorPubkey });
    await createTestUser({ pubkey: outsiderPubkey });

    const { workspace } = await createTestWorkspace({
      ownerPubkey,
      name: `Budget Test Workspace ${Date.now()}`,
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
    // Clean up transactions first to avoid foreign key constraints
    await db.transaction.deleteMany({
      where: { workspaceId },
    });
    await cleanupTestUsers([ownerPubkey, adminPubkey, contributorPubkey, outsiderPubkey]);
    await disconnectTestDb();
  });

  describe("POST /api/workspaces/[id]/budget", () => {
    it("deposits funds as owner", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}/budget`, {
        method: "POST",
        headers: { "x-user-pubkey": ownerPubkey },
        body: JSON.stringify({
          amount: 50000,
          memo: "Initial funding",
        }),
      });

      const response = await POST_BUDGET(request, { params: Promise.resolve({ id: workspaceId }) });
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.data.transaction.type).toBe(TransactionType.DEPOSIT);
      expect(result.data.transaction.amount).toBe("50000");
      expect(result.data.budget.totalBudget).toBe("50000");
      expect(result.data.budget.availableBudget).toBe("50000");
    });

    it("deposits funds as admin", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}/budget`, {
        method: "POST",
        headers: { "x-user-pubkey": adminPubkey },
        body: JSON.stringify({
          amount: 25000,
        }),
      });

      const response = await POST_BUDGET(request, { params: Promise.resolve({ id: workspaceId }) });
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.data.budget.totalBudget).toBe("75000"); // 50000 + 25000
      expect(result.data.budget.availableBudget).toBe("75000");
    });

    it("prevents contributor from depositing funds", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}/budget`, {
        method: "POST",
        headers: { "x-user-pubkey": contributorPubkey },
        body: JSON.stringify({
          amount: 10000,
        }),
      });

      const response = await POST_BUDGET(request, { params: Promise.resolve({ id: workspaceId }) });
      expect(response.status).toBe(403);
    });

    it("validates amount is positive", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}/budget`, {
        method: "POST",
        headers: { "x-user-pubkey": ownerPubkey },
        body: JSON.stringify({
          amount: -1000,
        }),
      });

      const response = await POST_BUDGET(request, { params: Promise.resolve({ id: workspaceId }) });
      expect(response.status).toBe(422);
    });

    it("validates amount is at least 1 sat", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}/budget`, {
        method: "POST",
        headers: { "x-user-pubkey": ownerPubkey },
        body: JSON.stringify({
          amount: 0,
        }),
      });

      const response = await POST_BUDGET(request, { params: Promise.resolve({ id: workspaceId }) });
      expect(response.status).toBe(422);
    });

    it("requires authentication", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}/budget`, {
        method: "POST",
        body: JSON.stringify({
          amount: 10000,
        }),
      });

      const response = await POST_BUDGET(request, { params: Promise.resolve({ id: workspaceId }) });
      expect(response.status).toBe(401);
    });

    it("prevents non-members from depositing", async () => {
      const request = createNextRequest(`http://localhost/api/workspaces/${workspaceId}/budget`, {
        method: "POST",
        headers: { "x-user-pubkey": outsiderPubkey },
        body: JSON.stringify({
          amount: 10000,
        }),
      });

      const response = await POST_BUDGET(request, { params: Promise.resolve({ id: workspaceId }) });
      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/workspaces/[id]/transactions", () => {
    it("lists all transactions", async () => {
      const request = createNextRequest(
        `http://localhost/api/workspaces/${workspaceId}/transactions`,
        {
          method: "GET",
          headers: { "x-user-pubkey": ownerPubkey },
        }
      );

      const response = await GET_TRANSACTIONS(request, {
        params: Promise.resolve({ id: workspaceId }),
      });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.data.transactions).toHaveLength(2); // 2 deposits from earlier tests
      expect(result.data.transactions[0].type).toBe(TransactionType.DEPOSIT);
      expect(result.data.pagination.total).toBe(2);
    });

    it("supports pagination", async () => {
      const request = createNextRequest(
        `http://localhost/api/workspaces/${workspaceId}/transactions?page=1&perPage=1`,
        {
          method: "GET",
          headers: { "x-user-pubkey": ownerPubkey },
        }
      );

      const response = await GET_TRANSACTIONS(request, {
        params: Promise.resolve({ id: workspaceId }),
      });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.data.transactions).toHaveLength(1);
      expect(result.data.pagination.page).toBe(1);
      expect(result.data.pagination.perPage).toBe(1);
      expect(result.data.pagination.totalPages).toBe(2);
    });

    it("filters by transaction type", async () => {
      const request = createNextRequest(
        `http://localhost/api/workspaces/${workspaceId}/transactions?type=DEPOSIT`,
        {
          method: "GET",
          headers: { "x-user-pubkey": ownerPubkey },
        }
      );

      const response = await GET_TRANSACTIONS(request, {
        params: Promise.resolve({ id: workspaceId }),
      });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.data.transactions.every((t: { type: string }) => t.type === "DEPOSIT")).toBe(
        true
      );
    });

    it("requires authentication", async () => {
      const request = createNextRequest(
        `http://localhost/api/workspaces/${workspaceId}/transactions`,
        {
          method: "GET",
        }
      );

      const response = await GET_TRANSACTIONS(request, {
        params: Promise.resolve({ id: workspaceId }),
      });
      expect(response.status).toBe(401);
    });

    it("prevents non-members from viewing transactions", async () => {
      const request = createNextRequest(
        `http://localhost/api/workspaces/${workspaceId}/transactions`,
        {
          method: "GET",
          headers: { "x-user-pubkey": outsiderPubkey },
        }
      );

      const response = await GET_TRANSACTIONS(request, {
        params: Promise.resolve({ id: workspaceId }),
      });
      expect(response.status).toBe(404);
    });

    it("allows contributors to view transactions", async () => {
      const request = createNextRequest(
        `http://localhost/api/workspaces/${workspaceId}/transactions`,
        {
          method: "GET",
          headers: { "x-user-pubkey": contributorPubkey },
        }
      );

      const response = await GET_TRANSACTIONS(request, {
        params: Promise.resolve({ id: workspaceId }),
      });
      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/workspaces/[id]/activities", () => {
    it("lists all activities", async () => {
      const request = createNextRequest(
        `http://localhost/api/workspaces/${workspaceId}/activities`,
        {
          method: "GET",
          headers: { "x-user-pubkey": ownerPubkey },
        }
      );

      const response = await GET_ACTIVITIES(request, {
        params: Promise.resolve({ id: workspaceId }),
      });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.data.activities.length).toBeGreaterThan(0);
      expect(result.data.pagination.total).toBeGreaterThan(0);
    });

    it("supports pagination", async () => {
      const request = createNextRequest(
        `http://localhost/api/workspaces/${workspaceId}/activities?page=1&perPage=2`,
        {
          method: "GET",
          headers: { "x-user-pubkey": ownerPubkey },
        }
      );

      const response = await GET_ACTIVITIES(request, {
        params: Promise.resolve({ id: workspaceId }),
      });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.data.pagination.page).toBe(1);
      expect(result.data.pagination.perPage).toBe(2);
    });

    it("filters by action type", async () => {
      const request = createNextRequest(
        `http://localhost/api/workspaces/${workspaceId}/activities?action=BUDGET_DEPOSITED`,
        {
          method: "GET",
          headers: { "x-user-pubkey": ownerPubkey },
        }
      );

      const response = await GET_ACTIVITIES(request, {
        params: Promise.resolve({ id: workspaceId }),
      });
      const result = await response.json();

      expect(response.status).toBe(200);
      if (result.data.activities.length > 0) {
        expect(
          result.data.activities.every(
            (a: { action: string }) => a.action === WorkspaceActivityAction.BUDGET_DEPOSITED
          )
        ).toBe(true);
      }
    });

    it("includes user details", async () => {
      const request = createNextRequest(
        `http://localhost/api/workspaces/${workspaceId}/activities`,
        {
          method: "GET",
          headers: { "x-user-pubkey": ownerPubkey },
        }
      );

      const response = await GET_ACTIVITIES(request, {
        params: Promise.resolve({ id: workspaceId }),
      });
      const result = await response.json();

      expect(response.status).toBe(200);
      if (result.data.activities.length > 0) {
        expect(result.data.activities[0].user).toBeDefined();
        expect(result.data.activities[0].user.pubkey).toBeDefined();
        expect(result.data.activities[0].user.username).toBeDefined();
      }
    });

    it("requires authentication", async () => {
      const request = createNextRequest(
        `http://localhost/api/workspaces/${workspaceId}/activities`,
        {
          method: "GET",
        }
      );

      const response = await GET_ACTIVITIES(request, {
        params: Promise.resolve({ id: workspaceId }),
      });
      expect(response.status).toBe(401);
    });

    it("prevents non-members from viewing activities", async () => {
      const request = createNextRequest(
        `http://localhost/api/workspaces/${workspaceId}/activities`,
        {
          method: "GET",
          headers: { "x-user-pubkey": outsiderPubkey },
        }
      );

      const response = await GET_ACTIVITIES(request, {
        params: Promise.resolve({ id: workspaceId }),
      });
      expect(response.status).toBe(404);
    });

    it("allows contributors to view activities", async () => {
      const request = createNextRequest(
        `http://localhost/api/workspaces/${workspaceId}/activities`,
        {
          method: "GET",
          headers: { "x-user-pubkey": contributorPubkey },
        }
      );

      const response = await GET_ACTIVITIES(request, {
        params: Promise.resolve({ id: workspaceId }),
      });
      expect(response.status).toBe(200);
    });
  });

  describe("Budget consistency", () => {
    it("maintains budget consistency after multiple deposits", async () => {
      const budget = await db.workspaceBudget.findUnique({
        where: { workspaceId },
      });

      expect(budget).toBeDefined();
      expect(budget?.totalBudget).toBe(75000); // 50000 + 25000 from earlier tests
      expect(budget?.availableBudget).toBe(75000);
    });
  });
});
