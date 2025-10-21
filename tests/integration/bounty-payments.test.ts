import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { db } from "@/lib/db";
import { BountyStatus, WorkspaceRole, TransactionStatus, TransactionType } from "@prisma/client";

const API_BASE_URL = "http://localhost:3000/api";

const testWorkspace = {
  id: "test-workspace-payments",
  name: "Test Workspace Payments",
  ownerPubkey: "owner-payment-test",
  description: "Workspace for payment tests",
};

const testUsers = {
  owner: {
    pubkey: "owner-payment-test",
    username: "ownerPayment",
    alias: "Owner Payment",
  },
  admin: {
    pubkey: "admin-payment-test",
    username: "adminPayment",
    alias: "Admin Payment",
  },
  member: {
    pubkey: "member-payment-test",
    username: "memberPayment",
    alias: "Member Payment",
  },
  assignee: {
    pubkey: "assignee-payment-test",
    username: "assigneePayment",
    alias: "Assignee Payment",
  },
  outsider: {
    pubkey: "outsider-payment-test",
    username: "outsiderPayment",
    alias: "Outsider Payment",
  },
};

const testBounty = {
  id: "test-bounty-payment",
  workspaceId: testWorkspace.id,
  creatorPubkey: testUsers.owner.pubkey,
  title: "Test Bounty for Payments",
  description: "Testing payment processing",
  deliverables: "Complete payment feature implementation",
  amount: BigInt(50000),
  status: BountyStatus.COMPLETED,
  assigneePubkey: testUsers.assignee.pubkey,
};

describe("Bounty Payment Endpoints", () => {
  beforeAll(async () => {
    // Create test users
    for (const user of Object.values(testUsers)) {
      await db.user.upsert({
        where: { pubkey: user.pubkey },
        update: {},
        create: user,
      });
    }

    // Create test workspace
    await db.workspace.upsert({
      where: { id: testWorkspace.id },
      update: {},
      create: testWorkspace,
    });

    // Create workspace budget
    await db.workspaceBudget.upsert({
      where: { workspaceId: testWorkspace.id },
      update: {},
      create: {
        workspaceId: testWorkspace.id,
        totalBudget: BigInt(1000000),
        availableBudget: BigInt(900000),
        reservedBudget: BigInt(100000),
        paidBudget: BigInt(0),
      },
    });

    // Add workspace members
    await db.workspaceMember.upsert({
      where: {
        workspaceId_userPubkey: {
          workspaceId: testWorkspace.id,
          userPubkey: testUsers.admin.pubkey,
        },
      },
      update: {},
      create: {
        workspaceId: testWorkspace.id,
        userPubkey: testUsers.admin.pubkey,
        role: WorkspaceRole.ADMIN,
      },
    });

    await db.workspaceMember.upsert({
      where: {
        workspaceId_userPubkey: {
          workspaceId: testWorkspace.id,
          userPubkey: testUsers.member.pubkey,
        },
      },
      update: {},
      create: {
        workspaceId: testWorkspace.id,
        userPubkey: testUsers.member.pubkey,
        role: WorkspaceRole.CONTRIBUTOR,
      },
    });

    await db.workspaceMember.upsert({
      where: {
        workspaceId_userPubkey: {
          workspaceId: testWorkspace.id,
          userPubkey: testUsers.assignee.pubkey,
        },
      },
      update: {},
      create: {
        workspaceId: testWorkspace.id,
        userPubkey: testUsers.assignee.pubkey,
        role: WorkspaceRole.CONTRIBUTOR,
      },
    });
  });

  beforeEach(async () => {
    // Clean up transactions and bounty activities
    await db.bountyActivity.deleteMany({
      where: { bountyId: testBounty.id },
    });

    await db.transaction.deleteMany({
      where: { bountyId: testBounty.id },
    });

    // Reset bounty
    await db.bounty.deleteMany({
      where: { id: testBounty.id },
    });

    await db.bountyProof.deleteMany({
      where: { bountyId: testBounty.id },
    });

    // Reset workspace budget
    await db.workspaceBudget.update({
      where: { workspaceId: testWorkspace.id },
      data: {
        reservedBudget: BigInt(100000),
        paidBudget: BigInt(0),
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await db.bountyActivity.deleteMany({
      where: { bountyId: testBounty.id },
    });

    await db.transaction.deleteMany({
      where: { workspaceId: testWorkspace.id },
    });

    await db.bountyProof.deleteMany({
      where: { bountyId: testBounty.id },
    });

    await db.bounty.deleteMany({
      where: { id: testBounty.id },
    });

    await db.workspaceMember.deleteMany({
      where: { workspaceId: testWorkspace.id },
    });

    await db.workspaceBudget.deleteMany({
      where: { workspaceId: testWorkspace.id },
    });

    await db.workspace.deleteMany({
      where: { id: testWorkspace.id },
    });

    for (const user of Object.values(testUsers)) {
      await db.user.deleteMany({
        where: { pubkey: user.pubkey },
      });
    }
  });

  describe("POST /api/bounties/[id]/payment - Process Payment", () => {
    it("should process payment successfully as workspace owner", async () => {
      // Create completed bounty with accepted proof
      const bounty = await db.bounty.create({
        data: testBounty,
      });

      await db.bountyProof.create({
        data: {
          id: "proof-payment-1",
          bountyId: bounty.id,
          submittedByPubkey: testUsers.assignee.pubkey,
          proofUrl: "https://example.com/proof",
          description: "Payment test proof",
          status: "ACCEPTED",
          reviewedAt: new Date(),
          reviewedByPubkey: testUsers.owner.pubkey,
        },
      });

      const response = await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.owner.pubkey,
        },
        body: JSON.stringify({
          memo: "Payment for great work",
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.message).toBe("Payment initiated successfully");
      expect(data.data.transaction).toBeDefined();
      expect(data.data.transaction.amount).toBe(testBounty.amount.toString());
      expect(data.data.transaction.status).toBe(TransactionStatus.PENDING);

      // Verify transaction created
      const transaction = await db.transaction.findFirst({
        where: { bountyId: bounty.id },
      });
      expect(transaction).toBeDefined();
      expect(transaction?.type).toBe(TransactionType.PAYMENT);
      expect(transaction?.toUserPubkey).toBe(testUsers.assignee.pubkey);

      // Verify budget updated
      const budget = await db.workspaceBudget.findUnique({
        where: { workspaceId: testWorkspace.id },
      });
      expect(budget?.reservedBudget).toBe(BigInt(50000));
      expect(budget?.paidBudget).toBe(testBounty.amount);

      // Verify bounty marked as paid
      const updatedBounty = await db.bounty.findUnique({
        where: { id: bounty.id },
      });
      expect(updatedBounty?.paidAt).toBeDefined();

      // Verify activity logged
      const activity = await db.bountyActivity.findFirst({
        where: {
          bountyId: bounty.id,
          action: "PAID",
        },
      });
      expect(activity).toBeDefined();
    });

    it("should process payment successfully as workspace admin", async () => {
      const bounty = await db.bounty.create({
        data: testBounty,
      });

      await db.bountyProof.create({
        data: {
          id: "proof-payment-2",
          bountyId: bounty.id,
          submittedByPubkey: testUsers.assignee.pubkey,
          proofUrl: "https://example.com/proof",
          description: "Payment test proof",
          status: "ACCEPTED",
          reviewedAt: new Date(),
          reviewedByPubkey: testUsers.owner.pubkey,
        },
      });

      const response = await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.admin.pubkey,
        },
        body: JSON.stringify({
          memo: "Admin payment",
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it("should accept optional Lightning invoice", async () => {
      const bounty = await db.bounty.create({
        data: testBounty,
      });

      await db.bountyProof.create({
        data: {
          id: "proof-payment-3",
          bountyId: bounty.id,
          submittedByPubkey: testUsers.assignee.pubkey,
          proofUrl: "https://example.com/proof",
          description: "Payment test proof",
          status: "ACCEPTED",
          reviewedAt: new Date(),
          reviewedByPubkey: testUsers.owner.pubkey,
        },
      });

      const response = await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.owner.pubkey,
        },
        body: JSON.stringify({
          lightningInvoice: "lnbc1234567890",
          memo: "Payment with Lightning invoice",
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);

      const transaction = await db.transaction.findFirst({
        where: { bountyId: bounty.id },
      });
      expect(transaction?.lightningInvoice).toBe("lnbc1234567890");
    });

    it("should reject payment by non-admin member", async () => {
      const bounty = await db.bounty.create({
        data: testBounty,
      });

      await db.bountyProof.create({
        data: {
          id: "proof-payment-4",
          bountyId: bounty.id,
          submittedByPubkey: testUsers.assignee.pubkey,
          proofUrl: "https://example.com/proof",
          description: "Payment test proof",
          status: "ACCEPTED",
          reviewedAt: new Date(),
          reviewedByPubkey: testUsers.owner.pubkey,
        },
      });

      const response = await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.member.pubkey,
        },
        body: JSON.stringify({
          memo: "Unauthorized payment attempt",
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should reject payment by outsider", async () => {
      const bounty = await db.bounty.create({
        data: testBounty,
      });

      await db.bountyProof.create({
        data: {
          id: "proof-payment-5",
          bountyId: bounty.id,
          submittedByPubkey: testUsers.assignee.pubkey,
          proofUrl: "https://example.com/proof",
          description: "Payment test proof",
          status: "ACCEPTED",
          reviewedAt: new Date(),
          reviewedByPubkey: testUsers.owner.pubkey,
        },
      });

      const response = await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.outsider.pubkey,
        },
        body: JSON.stringify({
          memo: "Outsider payment attempt",
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should reject payment for non-COMPLETED bounty", async () => {
      const bounty = await db.bounty.create({
        data: {
          ...testBounty,
          status: BountyStatus.IN_REVIEW,
        },
      });

      const response = await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.owner.pubkey,
        },
        body: JSON.stringify({
          memo: "Payment for non-completed bounty",
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("INVALID_STATUS");
      expect(data.error.message).toContain("must be COMPLETED");
    });

    it("should reject payment for already paid bounty", async () => {
      const bounty = await db.bounty.create({
        data: {
          ...testBounty,
          paidAt: new Date(),
        },
      });

      await db.bountyProof.create({
        data: {
          id: "proof-payment-6",
          bountyId: bounty.id,
          submittedByPubkey: testUsers.assignee.pubkey,
          proofUrl: "https://example.com/proof",
          description: "Payment test proof",
          status: "ACCEPTED",
          reviewedAt: new Date(),
          reviewedByPubkey: testUsers.owner.pubkey,
        },
      });

      const response = await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.owner.pubkey,
        },
        body: JSON.stringify({
          memo: "Duplicate payment",
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("ALREADY_PAID");
    });

    it("should reject payment without assignee", async () => {
      const bounty = await db.bounty.create({
        data: {
          ...testBounty,
          assigneePubkey: null,
        },
      });

      await db.bountyProof.create({
        data: {
          id: "proof-payment-7",
          bountyId: bounty.id,
          submittedByPubkey: testUsers.assignee.pubkey,
          proofUrl: "https://example.com/proof",
          description: "Payment test proof",
          status: "ACCEPTED",
          reviewedAt: new Date(),
          reviewedByPubkey: testUsers.owner.pubkey,
        },
      });

      const response = await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.owner.pubkey,
        },
        body: JSON.stringify({
          memo: "Payment without assignee",
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("NO_ASSIGNEE");
    });

    it("should reject payment without accepted proof", async () => {
      const bounty = await db.bounty.create({
        data: testBounty,
      });

      const response = await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.owner.pubkey,
        },
        body: JSON.stringify({
          memo: "Payment without proof",
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("NO_ACCEPTED_PROOF");
    });

    it("should reject payment with insufficient reserved budget", async () => {
      // Set reserved budget to less than bounty amount
      await db.workspaceBudget.update({
        where: { workspaceId: testWorkspace.id },
        data: { reservedBudget: BigInt(10000) },
      });

      const bounty = await db.bounty.create({
        data: testBounty,
      });

      await db.bountyProof.create({
        data: {
          id: "proof-payment-8",
          bountyId: bounty.id,
          submittedByPubkey: testUsers.assignee.pubkey,
          proofUrl: "https://example.com/proof",
          description: "Payment test proof",
          status: "ACCEPTED",
          reviewedAt: new Date(),
          reviewedByPubkey: testUsers.owner.pubkey,
        },
      });

      const response = await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.owner.pubkey,
        },
        body: JSON.stringify({
          memo: "Payment with insufficient budget",
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("INSUFFICIENT_RESERVED_BUDGET");
    });

    it("should reject payment with invalid Lightning invoice format", async () => {
      const bounty = await db.bounty.create({
        data: testBounty,
      });

      await db.bountyProof.create({
        data: {
          id: "proof-payment-9",
          bountyId: bounty.id,
          submittedByPubkey: testUsers.assignee.pubkey,
          proofUrl: "https://example.com/proof",
          description: "Payment test proof",
          status: "ACCEPTED",
          reviewedAt: new Date(),
          reviewedByPubkey: testUsers.owner.pubkey,
        },
      });

      const response = await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.owner.pubkey,
        },
        body: JSON.stringify({
          lightningInvoice: "invalid-invoice",
          memo: "Invalid Lightning invoice",
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject payment without authentication", async () => {
      const bounty = await db.bounty.create({
        data: testBounty,
      });

      const response = await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memo: "Payment without auth",
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("should reject payment for non-existent bounty", async () => {
      const response = await fetch(`${API_BASE_URL}/bounties/non-existent-bounty/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.owner.pubkey,
        },
        body: JSON.stringify({
          memo: "Payment for non-existent bounty",
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("NOT_FOUND");
    });
  });

  describe("GET /api/bounties/[id]/payment - Get Payment Details", () => {
    it("should return payment details for workspace member", async () => {
      const bounty = await db.bounty.create({
        data: testBounty,
      });

      await db.bountyProof.create({
        data: {
          id: "proof-payment-get-1",
          bountyId: bounty.id,
          submittedByPubkey: testUsers.assignee.pubkey,
          proofUrl: "https://example.com/proof",
          description: "Payment test proof",
          status: "ACCEPTED",
          reviewedAt: new Date(),
          reviewedByPubkey: testUsers.owner.pubkey,
        },
      });

      // Create payment transaction
      await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.owner.pubkey,
        },
        body: JSON.stringify({
          memo: "Test payment",
        }),
      });

      const response = await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment`, {
        method: "GET",
        headers: {
          "x-user-pubkey": testUsers.member.pubkey,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.transaction).toBeDefined();
      expect(data.data.transaction.amount).toBe(testBounty.amount.toString());
      expect(data.data.transaction.status).toBe(TransactionStatus.PENDING);
      expect(data.data.bounty).toBeDefined();
      expect(data.data.bounty.id).toBe(bounty.id);
    });

    it("should return null transaction for bounty without payment", async () => {
      const bounty = await db.bounty.create({
        data: testBounty,
      });

      const response = await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment`, {
        method: "GET",
        headers: {
          "x-user-pubkey": testUsers.member.pubkey,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.transaction).toBeNull();
      expect(data.data.bounty).toBeDefined();
    });

    it("should reject request by non-member", async () => {
      const bounty = await db.bounty.create({
        data: testBounty,
      });

      const response = await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment`, {
        method: "GET",
        headers: {
          "x-user-pubkey": testUsers.outsider.pubkey,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should reject request without authentication", async () => {
      const bounty = await db.bounty.create({
        data: testBounty,
      });

      const response = await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment`, {
        method: "GET",
        headers: {},
      });

      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("should reject request for non-existent bounty", async () => {
      const response = await fetch(`${API_BASE_URL}/bounties/non-existent-bounty/payment`, {
        method: "GET",
        headers: {
          "x-user-pubkey": testUsers.member.pubkey,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("NOT_FOUND");
    });
  });

  describe("PATCH /api/bounties/[id]/payment/status - Update Payment Status", () => {
    it("should update payment status to COMPLETED as owner", async () => {
      const bounty = await db.bounty.create({
        data: testBounty,
      });

      await db.bountyProof.create({
        data: {
          id: "proof-payment-status-1",
          bountyId: bounty.id,
          submittedByPubkey: testUsers.assignee.pubkey,
          proofUrl: "https://example.com/proof",
          description: "Payment test proof",
          status: "ACCEPTED",
          reviewedAt: new Date(),
          reviewedByPubkey: testUsers.owner.pubkey,
        },
      });

      // Create payment
      await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.owner.pubkey,
        },
        body: JSON.stringify({
          memo: "Test payment for status update",
        }),
      });

      const response = await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.owner.pubkey,
        },
        body: JSON.stringify({
          status: TransactionStatus.COMPLETED,
          paymentHash: "a".repeat(64),
          preimage: "b".repeat(64),
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.message).toContain("COMPLETED");
      expect(data.data.transaction.status).toBe(TransactionStatus.COMPLETED);
      expect(data.data.transaction.completedAt).toBeDefined();

      // Verify transaction updated
      const transaction = await db.transaction.findFirst({
        where: { bountyId: bounty.id },
      });
      expect(transaction?.status).toBe(TransactionStatus.COMPLETED);
      expect(transaction?.paymentHash).toBe("a".repeat(64));
      expect(transaction?.preimage).toBe("b".repeat(64));
      expect(transaction?.completedAt).toBeDefined();
    });

    it("should update payment status to FAILED and return funds", async () => {
      const bounty = await db.bounty.create({
        data: testBounty,
      });

      await db.bountyProof.create({
        data: {
          id: "proof-payment-status-2",
          bountyId: bounty.id,
          submittedByPubkey: testUsers.assignee.pubkey,
          proofUrl: "https://example.com/proof",
          description: "Payment test proof",
          status: "ACCEPTED",
          reviewedAt: new Date(),
          reviewedByPubkey: testUsers.owner.pubkey,
        },
      });

      // Create payment
      await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.owner.pubkey,
        },
        body: JSON.stringify({
          memo: "Test payment for failure",
        }),
      });

      const response = await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.owner.pubkey,
        },
        body: JSON.stringify({
          status: TransactionStatus.FAILED,
          errorMessage: "Lightning payment failed",
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.transaction.status).toBe(TransactionStatus.FAILED);
      expect(data.data.transaction.errorMessage).toBe("Lightning payment failed");

      // Verify budget returned to reserved
      const budget = await db.workspaceBudget.findUnique({
        where: { workspaceId: testWorkspace.id },
      });
      expect(budget?.reservedBudget).toBe(BigInt(100000));
      expect(budget?.paidBudget).toBe(BigInt(0));

      // Verify bounty paidAt reset
      const updatedBounty = await db.bounty.findUnique({
        where: { id: bounty.id },
      });
      expect(updatedBounty?.paidAt).toBeNull();
    });

    it("should update payment status as admin", async () => {
      const bounty = await db.bounty.create({
        data: testBounty,
      });

      await db.bountyProof.create({
        data: {
          id: "proof-payment-status-3",
          bountyId: bounty.id,
          submittedByPubkey: testUsers.assignee.pubkey,
          proofUrl: "https://example.com/proof",
          description: "Payment test proof",
          status: "ACCEPTED",
          reviewedAt: new Date(),
          reviewedByPubkey: testUsers.owner.pubkey,
        },
      });

      // Create payment as owner
      await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.owner.pubkey,
        },
        body: JSON.stringify({
          memo: "Test payment",
        }),
      });

      // Update as admin
      const response = await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.admin.pubkey,
        },
        body: JSON.stringify({
          status: TransactionStatus.COMPLETED,
          paymentHash: "c".repeat(64),
          preimage: "d".repeat(64),
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should reject status update by non-admin member", async () => {
      const bounty = await db.bounty.create({
        data: testBounty,
      });

      await db.bountyProof.create({
        data: {
          id: "proof-payment-status-4",
          bountyId: bounty.id,
          submittedByPubkey: testUsers.assignee.pubkey,
          proofUrl: "https://example.com/proof",
          description: "Payment test proof",
          status: "ACCEPTED",
          reviewedAt: new Date(),
          reviewedByPubkey: testUsers.owner.pubkey,
        },
      });

      // Create payment
      await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.owner.pubkey,
        },
        body: JSON.stringify({
          memo: "Test payment",
        }),
      });

      const response = await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.member.pubkey,
        },
        body: JSON.stringify({
          status: TransactionStatus.COMPLETED,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("should reject status update for bounty without transaction", async () => {
      const bounty = await db.bounty.create({
        data: testBounty,
      });

      const response = await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.owner.pubkey,
        },
        body: JSON.stringify({
          status: TransactionStatus.COMPLETED,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("NO_TRANSACTION");
    });

    it("should reject status update for already completed transaction", async () => {
      const bounty = await db.bounty.create({
        data: testBounty,
      });

      await db.bountyProof.create({
        data: {
          id: "proof-payment-status-5",
          bountyId: bounty.id,
          submittedByPubkey: testUsers.assignee.pubkey,
          proofUrl: "https://example.com/proof",
          description: "Payment test proof",
          status: "ACCEPTED",
          reviewedAt: new Date(),
          reviewedByPubkey: testUsers.owner.pubkey,
        },
      });

      // Create and complete payment
      await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.owner.pubkey,
        },
        body: JSON.stringify({
          memo: "Test payment",
        }),
      });

      await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.owner.pubkey,
        },
        body: JSON.stringify({
          status: TransactionStatus.COMPLETED,
          paymentHash: "e".repeat(64),
          preimage: "f".repeat(64),
        }),
      });

      // Try to update again
      const response = await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.owner.pubkey,
        },
        body: JSON.stringify({
          status: TransactionStatus.FAILED,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("INVALID_TRANSACTION_STATUS");
    });

    it("should reject invalid payment hash format", async () => {
      const bounty = await db.bounty.create({
        data: testBounty,
      });

      await db.bountyProof.create({
        data: {
          id: "proof-payment-status-6",
          bountyId: bounty.id,
          submittedByPubkey: testUsers.assignee.pubkey,
          proofUrl: "https://example.com/proof",
          description: "Payment test proof",
          status: "ACCEPTED",
          reviewedAt: new Date(),
          reviewedByPubkey: testUsers.owner.pubkey,
        },
      });

      // Create payment
      await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.owner.pubkey,
        },
        body: JSON.stringify({
          memo: "Test payment",
        }),
      });

      const response = await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-pubkey": testUsers.owner.pubkey,
        },
        body: JSON.stringify({
          status: TransactionStatus.COMPLETED,
          paymentHash: "invalid-hash",
          preimage: "g".repeat(64),
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject status update without authentication", async () => {
      const bounty = await db.bounty.create({
        data: testBounty,
      });

      const response = await fetch(`${API_BASE_URL}/bounties/${bounty.id}/payment/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: TransactionStatus.COMPLETED,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("UNAUTHORIZED");
    });
  });
});
