import { describe, it, expect } from "vitest";
import { WorkspaceRole } from "@prisma/client";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  removeMemberSchema,
  depositBudgetSchema,
} from "@/validations/workspace.schema";

describe("Workspace Validation Schemas", () => {
  describe("createWorkspaceSchema", () => {
    const validData = {
      name: "My Workspace",
      description: "This is a workspace",
    };

    it("validates correct workspace data", () => {
      const result = createWorkspaceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("rejects name less than 3 characters", () => {
      const result = createWorkspaceSchema.safeParse({
        ...validData,
        name: "ab",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 3 characters");
      }
    });

    it("rejects name exceeding max length", () => {
      const result = createWorkspaceSchema.safeParse({
        ...validData,
        name: "a".repeat(51),
      });
      expect(result.success).toBe(false);
    });

    it("rejects name with invalid characters", () => {
      const result = createWorkspaceSchema.safeParse({
        ...validData,
        name: "My@Workspace",
      });
      expect(result.success).toBe(false);
    });

    it("validates optional description", () => {
      const result = createWorkspaceSchema.safeParse({
        name: "Workspace",
        description: "A detailed description",
      });
      expect(result.success).toBe(true);
    });

    it("validates optional mission", () => {
      const result = createWorkspaceSchema.safeParse({
        name: "Workspace",
        mission: "To build amazing software",
      });
      expect(result.success).toBe(true);
    });

    it("validates avatar URL", () => {
      const result = createWorkspaceSchema.safeParse({
        ...validData,
        avatarUrl: "https://example.com/avatar.png",
      });
      expect(result.success).toBe(true);
    });

    it("validates GitHub URL format", () => {
      const result = createWorkspaceSchema.safeParse({
        ...validData,
        githubUrl: "https://github.com/myorg",
      });
      expect(result.success).toBe(true);
    });

    it("rejects non-GitHub URL for githubUrl", () => {
      const result = createWorkspaceSchema.safeParse({
        ...validData,
        githubUrl: "https://gitlab.com/myorg",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateWorkspaceSchema", () => {
    it("validates partial update with ID", () => {
      const result = updateWorkspaceSchema.safeParse({
        id: "clx1234567890abcdef",
        name: "Updated Name",
      });
      expect(result.success).toBe(true);
    });

    it("requires valid workspace ID", () => {
      const result = updateWorkspaceSchema.safeParse({
        id: "invalid-id",
        name: "Updated Name",
      });
      expect(result.success).toBe(false);
    });

    it("validates all optional fields", () => {
      const result = updateWorkspaceSchema.safeParse({
        id: "clx1234567890abcdef",
        name: "New Name",
        description: "New description",
        mission: "New mission statement here",
        avatarUrl: "https://example.com/new-avatar.png",
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty strings for optional fields", () => {
      const result = updateWorkspaceSchema.safeParse({
        id: "clx1234567890abcdef",
        description: "",
        mission: "",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("inviteMemberSchema", () => {
    const validData = {
      workspaceId: "clx1234567890abcdef",
      userPubkey: "02" + "a".repeat(64),
      role: WorkspaceRole.CONTRIBUTOR,
    };

    it("validates member invitation", () => {
      const result = inviteMemberSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("defaults to CONTRIBUTOR role", () => {
      const result = inviteMemberSchema.parse({
        workspaceId: "clx1234567890abcdef",
        userPubkey: "02" + "a".repeat(64),
      });
      expect(result.role).toBe(WorkspaceRole.CONTRIBUTOR);
    });

    it("validates optional invitation message", () => {
      const result = inviteMemberSchema.safeParse({
        ...validData,
        message: "Welcome to our workspace!",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid pubkey", () => {
      const result = inviteMemberSchema.safeParse({
        ...validData,
        userPubkey: "short",
      });
      expect(result.success).toBe(false);
    });

    it("validates ADMIN role", () => {
      const result = inviteMemberSchema.safeParse({
        ...validData,
        role: WorkspaceRole.ADMIN,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("updateMemberRoleSchema", () => {
    it("validates role update", () => {
      const result = updateMemberRoleSchema.safeParse({
        workspaceId: "clx1234567890abcdef",
        membershipId: "clx9876543210zyxwvu",
        role: WorkspaceRole.ADMIN,
      });
      expect(result.success).toBe(true);
    });

    it("requires valid workspace ID", () => {
      const result = updateMemberRoleSchema.safeParse({
        workspaceId: "invalid",
        membershipId: "clx9876543210zyxwvu",
        role: WorkspaceRole.ADMIN,
      });
      expect(result.success).toBe(false);
    });

    it("requires valid membership ID", () => {
      const result = updateMemberRoleSchema.safeParse({
        workspaceId: "clx1234567890abcdef",
        membershipId: "invalid",
        role: WorkspaceRole.ADMIN,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("removeMemberSchema", () => {
    it("validates member removal", () => {
      const result = removeMemberSchema.safeParse({
        workspaceId: "clx1234567890abcdef",
        membershipId: "clx9876543210zyxwvu",
      });
      expect(result.success).toBe(true);
    });

    it("requires valid IDs", () => {
      const result = removeMemberSchema.safeParse({
        workspaceId: "invalid",
        membershipId: "also-invalid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("depositBudgetSchema", () => {
    it("validates budget deposit", () => {
      const result = depositBudgetSchema.safeParse({
        workspaceId: "clx1234567890abcdef",
        amount: 50000,
      });
      expect(result.success).toBe(true);
    });

    it("rejects negative amount", () => {
      const result = depositBudgetSchema.safeParse({
        workspaceId: "clx1234567890abcdef",
        amount: -1000,
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer amount", () => {
      const result = depositBudgetSchema.safeParse({
        workspaceId: "clx1234567890abcdef",
        amount: 100.5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects amount below minimum", () => {
      const result = depositBudgetSchema.safeParse({
        workspaceId: "clx1234567890abcdef",
        amount: 500,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("1,000");
      }
    });

    it("validates optional invoice details", () => {
      const result = depositBudgetSchema.safeParse({
        workspaceId: "clx1234567890abcdef",
        amount: 50000,
        invoiceDetails: {
          memo: "Budget deposit",
          expiresIn: 7200,
        },
      });
      expect(result.success).toBe(true);
    });

    it("applies default expiresIn", () => {
      const result = depositBudgetSchema.parse({
        workspaceId: "clx1234567890abcdef",
        amount: 50000,
        invoiceDetails: {
          memo: "Budget deposit",
        },
      });
      expect(result.invoiceDetails?.expiresIn).toBe(3600);
    });
  });
});
