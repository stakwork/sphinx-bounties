import { describe, it, expect } from "vitest";
import {
  updateProfileSchema,
  verifyGithubSchema,
  verifyTwitterSchema,
  updateNotificationSettingsSchema,
  deleteAccountSchema,
} from "@/validations/user.schema";

describe("User Validation Schemas", () => {
  describe("updateProfileSchema", () => {
    it("validates optional username update", () => {
      const result = updateProfileSchema.safeParse({
        username: "john_doe",
      });
      expect(result.success).toBe(true);
    });

    it("rejects username less than 3 characters", () => {
      const result = updateProfileSchema.safeParse({
        username: "ab",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 3 characters");
      }
    });

    it("rejects username exceeding 20 characters", () => {
      const result = updateProfileSchema.safeParse({
        username: "a".repeat(21),
      });
      expect(result.success).toBe(false);
    });

    it("rejects username with special characters", () => {
      const result = updateProfileSchema.safeParse({
        username: "john@doe",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("letters, numbers, and underscores");
      }
    });

    it("validates alias update", () => {
      const result = updateProfileSchema.safeParse({
        alias: "John Doe",
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty string for alias", () => {
      const result = updateProfileSchema.safeParse({
        alias: "",
      });
      expect(result.success).toBe(true);
    });

    it("validates description update", () => {
      const result = updateProfileSchema.safeParse({
        description: "Software developer with passion for blockchain",
      });
      expect(result.success).toBe(true);
    });

    it("rejects description exceeding max length", () => {
      const result = updateProfileSchema.safeParse({
        description: "a".repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it("validates avatar URL", () => {
      const result = updateProfileSchema.safeParse({
        avatarUrl: "https://example.com/avatar.png",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid avatar URL", () => {
      const result = updateProfileSchema.safeParse({
        avatarUrl: "not-a-url",
      });
      expect(result.success).toBe(false);
    });

    it("validates contact key format", () => {
      const result = updateProfileSchema.safeParse({
        contactKey: "02" + "a".repeat(64),
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid contact key length", () => {
      const result = updateProfileSchema.safeParse({
        contactKey: "short",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid contact key format", () => {
      const result = updateProfileSchema.safeParse({
        contactKey: "x".repeat(66),
      });
      expect(result.success).toBe(false);
    });

    it("validates GitHub username", () => {
      const result = updateProfileSchema.safeParse({
        githubUsername: "octocat",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid GitHub username format", () => {
      const result = updateProfileSchema.safeParse({
        githubUsername: "-invalid",
      });
      expect(result.success).toBe(false);
    });

    it("validates Twitter username", () => {
      const result = updateProfileSchema.safeParse({
        twitterUsername: "jack",
      });
      expect(result.success).toBe(true);
    });

    it("rejects Twitter username exceeding 15 characters", () => {
      const result = updateProfileSchema.safeParse({
        twitterUsername: "a".repeat(16),
      });
      expect(result.success).toBe(false);
    });

    it("validates multiple fields update", () => {
      const result = updateProfileSchema.safeParse({
        username: "johndoe",
        alias: "John Doe",
        description: "Software engineer",
        githubUsername: "johndoe",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("verifyGithubSchema", () => {
    it("validates verification code", () => {
      const result = verifyGithubSchema.safeParse({
        code: "abc123xyz",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty code", () => {
      const result = verifyGithubSchema.safeParse({
        code: "",
      });
      expect(result.success).toBe(false);
    });

    it("requires code field", () => {
      const result = verifyGithubSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("verifyTwitterSchema", () => {
    it("validates verification code", () => {
      const result = verifyTwitterSchema.safeParse({
        code: "xyz789abc",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty code", () => {
      const result = verifyTwitterSchema.safeParse({
        code: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateNotificationSettingsSchema", () => {
    it("validates notification preferences", () => {
      const result = updateNotificationSettingsSchema.safeParse({
        emailNotifications: true,
        notifyOnBountyAssigned: true,
        notifyOnPaymentReceived: false,
      });
      expect(result.success).toBe(true);
    });

    it("applies default values", () => {
      const result = updateNotificationSettingsSchema.parse({});
      expect(result.emailNotifications).toBe(true);
      expect(result.pushNotifications).toBe(true);
      expect(result.notifyOnBountyAssigned).toBe(true);
    });

    it("validates all boolean fields", () => {
      const result = updateNotificationSettingsSchema.safeParse({
        emailNotifications: false,
        pushNotifications: false,
        notifyOnBountyAssigned: false,
        notifyOnBountyCompleted: false,
        notifyOnPaymentReceived: false,
        notifyOnProofReviewed: false,
        notifyOnWorkspaceInvite: false,
        notifyOnMemberAdded: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("deleteAccountSchema", () => {
    it("validates account deletion with confirmation", () => {
      const result = deleteAccountSchema.safeParse({
        confirmation: "DELETE",
        reason: "Switching to another platform",
      });
      expect(result.success).toBe(true);
    });

    it("rejects incorrect confirmation text", () => {
      const result = deleteAccountSchema.safeParse({
        confirmation: "delete",
        reason: "Not happy with service",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("type DELETE to confirm");
      }
    });

    it("validates without optional reason", () => {
      const result = deleteAccountSchema.safeParse({
        confirmation: "DELETE",
      });
      expect(result.success).toBe(true);
    });

    it("rejects reason less than 10 characters", () => {
      const result = deleteAccountSchema.safeParse({
        confirmation: "DELETE",
        reason: "Too short",
      });
      expect(result.success).toBe(false);
    });

    it("rejects reason exceeding max length", () => {
      const result = deleteAccountSchema.safeParse({
        confirmation: "DELETE",
        reason: "a".repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });
});
