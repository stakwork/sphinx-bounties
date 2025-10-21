import { describe, it, expect } from "vitest";
import { BountyStatus } from "@prisma/client";
import {
  createBountySchema,
  updateBountySchema,
  claimBountySchema,
  unclaimBountySchema,
  submitProofSchema,
  reviewProofSchema,
} from "@/validations/bounty.schema";

describe("Bounty Validation Schemas", () => {
  describe("createBountySchema", () => {
    const validData = {
      title: "Build a feature",
      description: "This is a detailed description of the bounty requirements",
      deliverables: "Clear acceptance criteria and deliverables for this bounty",
      amount: 10000,
      workspaceId: "clx1234567890abcdef",
    };

    it("validates correct bounty data", () => {
      const result = createBountySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("rejects title less than 5 characters", () => {
      const result = createBountySchema.safeParse({
        ...validData,
        title: "abc",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 5 characters");
      }
    });

    it("rejects title exceeding max length", () => {
      const result = createBountySchema.safeParse({
        ...validData,
        title: "a".repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it("rejects description less than 20 characters", () => {
      const result = createBountySchema.safeParse({
        ...validData,
        description: "Too short",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 20 characters");
      }
    });

    it("rejects negative amount", () => {
      const result = createBountySchema.safeParse({
        ...validData,
        amount: -100,
      });
      expect(result.success).toBe(false);
    });

    it("rejects amount below minimum", () => {
      const result = createBountySchema.safeParse({
        ...validData,
        amount: 10,
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer amount", () => {
      const result = createBountySchema.safeParse({
        ...validData,
        amount: 100.5,
      });
      expect(result.success).toBe(false);
    });

    it("accepts future estimatedCompletionDate", () => {
      const futureDate = new Date(Date.now() + 86400000);
      const result = createBountySchema.safeParse({
        ...validData,
        estimatedCompletionDate: futureDate,
      });
      expect(result.success).toBe(true);
    });

    it("rejects past estimatedCompletionDate", () => {
      const pastDate = new Date(Date.now() - 86400000);
      const result = createBountySchema.safeParse({
        ...validData,
        estimatedCompletionDate: pastDate,
      });
      expect(result.success).toBe(false);
    });

    it("validates correct GitHub issue URL", () => {
      const result = createBountySchema.safeParse({
        ...validData,
        githubIssueUrl: "https://github.com/owner/repo/issues/123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid GitHub URL", () => {
      const result = createBountySchema.safeParse({
        ...validData,
        githubIssueUrl: "https://gitlab.com/owner/repo/issues/123",
      });
      expect(result.success).toBe(false);
    });

    it("accepts empty string for GitHub URL", () => {
      const result = createBountySchema.safeParse({
        ...validData,
        githubIssueUrl: "",
      });
      expect(result.success).toBe(true);
    });

    it("validates tags array", () => {
      const result = createBountySchema.safeParse({
        ...validData,
        tags: ["javascript", "react", "frontend"],
      });
      expect(result.success).toBe(true);
    });

    it("rejects too many tags", () => {
      const result = createBountySchema.safeParse({
        ...validData,
        tags: Array(15).fill("tag"),
      });
      expect(result.success).toBe(false);
    });

    it("defaults status to DRAFT", () => {
      const result = createBountySchema.parse(validData);
      expect(result.status).toBe(BountyStatus.DRAFT);
    });

    it("defaults tags to empty array", () => {
      const result = createBountySchema.parse(validData);
      expect(result.tags).toEqual([]);
    });
  });

  describe("updateBountySchema", () => {
    const validData = {
      id: "clx1234567890abcdef",
      title: "Updated title",
    };

    it("validates partial update", () => {
      const result = updateBountySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("requires valid bounty ID", () => {
      const result = updateBountySchema.safeParse({
        id: "invalid-id",
      });
      expect(result.success).toBe(false);
    });

    it("validates all optional fields", () => {
      const result = updateBountySchema.safeParse({
        id: "clx1234567890abcdef",
        title: "New title",
        description: "New description with enough characters",
        amount: 20000,
        status: BountyStatus.OPEN,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("claimBountySchema", () => {
    it("validates bounty claim", () => {
      const result = claimBountySchema.safeParse({
        bountyId: "clx1234567890abcdef",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid bounty ID", () => {
      const result = claimBountySchema.safeParse({
        bountyId: "invalid",
      });
      expect(result.success).toBe(false);
    });

    it("validates optional claim message", () => {
      const result = claimBountySchema.safeParse({
        bountyId: "clx1234567890abcdef",
        message: "I would like to work on this bounty",
      });
      expect(result.success).toBe(true);
    });

    it("rejects message less than 10 characters", () => {
      const result = claimBountySchema.safeParse({
        bountyId: "clx1234567890abcdef",
        message: "Too short",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("unclaimBountySchema", () => {
    it("validates bounty unclaim", () => {
      const result = unclaimBountySchema.safeParse({
        bountyId: "clx1234567890abcdef",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid bounty ID", () => {
      const result = unclaimBountySchema.safeParse({
        bountyId: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("submitProofSchema", () => {
    const validData = {
      bountyId: "clx1234567890abcdef",
      proofUrl: "https://github.com/owner/repo/pull/123",
      description: "This is my proof of work submission",
    };

    it("validates correct proof submission", () => {
      const result = submitProofSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("requires description", () => {
      const result = submitProofSchema.safeParse({
        bountyId: "clx1234567890abcdef",
        proofUrl: "https://github.com/owner/repo/pull/123",
      });
      expect(result.success).toBe(false);
    });

    it("validates proof URL format", () => {
      const result = submitProofSchema.safeParse({
        ...validData,
        proofUrl: "not-a-url",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("reviewProofSchema", () => {
    it("validates approval", () => {
      const result = reviewProofSchema.safeParse({
        proofId: "clx1234567890abcdef",
        approved: true,
        feedback: "Great work!",
      });
      expect(result.success).toBe(true);
    });

    it("validates rejection with feedback", () => {
      const result = reviewProofSchema.safeParse({
        proofId: "clx1234567890abcdef",
        approved: false,
        feedback: "Please address these issues...",
      });
      expect(result.success).toBe(true);
    });

    it("validates review without optional feedback", () => {
      const result = reviewProofSchema.safeParse({
        proofId: "clx1234567890abcdef",
        approved: true,
      });
      expect(result.success).toBe(true);
    });

    it("rejects feedback less than 10 characters", () => {
      const result = reviewProofSchema.safeParse({
        proofId: "clx1234567890abcdef",
        approved: true,
        feedback: "Too short",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid proof ID", () => {
      const result = reviewProofSchema.safeParse({
        proofId: "invalid",
        approved: true,
      });
      expect(result.success).toBe(false);
    });
  });
});
