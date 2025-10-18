import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  logoutSchema,
  getChallengeSchema,
  verifySignatureSchema,
} from "@/validations/auth.schema";

describe("Auth Validation Schemas", () => {
  describe("loginSchema", () => {
    const validData = {
      pubkey: "02" + "a".repeat(64),
      signature: "304402201234...",
      challenge: "challenge-string-123",
    };

    it("validates correct login data", () => {
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("rejects invalid pubkey length", () => {
      const result = loginSchema.safeParse({
        ...validData,
        pubkey: "short",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid pubkey format");
      }
    });

    it("rejects non-hex pubkey", () => {
      const result = loginSchema.safeParse({
        ...validData,
        pubkey: "x".repeat(66),
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty signature", () => {
      const result = loginSchema.safeParse({
        ...validData,
        signature: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty challenge", () => {
      const result = loginSchema.safeParse({
        ...validData,
        challenge: "",
      });
      expect(result.success).toBe(false);
    });

    it("requires all fields", () => {
      const result = loginSchema.safeParse({
        pubkey: "02" + "a".repeat(64),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    const validData = {
      pubkey: "02" + "a".repeat(64),
      username: "johndoe",
      signature: "304402201234...",
      challenge: "challenge-string-123",
    };

    it("validates correct registration data", () => {
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("rejects username less than 3 characters", () => {
      const result = registerSchema.safeParse({
        ...validData,
        username: "ab",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 3 characters");
      }
    });

    it("rejects username exceeding 20 characters", () => {
      const result = registerSchema.safeParse({
        ...validData,
        username: "a".repeat(21),
      });
      expect(result.success).toBe(false);
    });

    it("rejects username with special characters", () => {
      const result = registerSchema.safeParse({
        ...validData,
        username: "john@doe",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("letters, numbers, and underscores");
      }
    });

    it("validates optional alias", () => {
      const result = registerSchema.safeParse({
        ...validData,
        alias: "John Doe",
      });
      expect(result.success).toBe(true);
    });

    it("rejects alias less than 2 characters", () => {
      const result = registerSchema.safeParse({
        ...validData,
        alias: "J",
      });
      expect(result.success).toBe(false);
    });

    it("rejects alias exceeding 50 characters", () => {
      const result = registerSchema.safeParse({
        ...validData,
        alias: "a".repeat(51),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("refreshTokenSchema", () => {
    it("validates refresh token", () => {
      const result = refreshTokenSchema.safeParse({
        refreshToken: "valid-refresh-token-123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty refresh token", () => {
      const result = refreshTokenSchema.safeParse({
        refreshToken: "",
      });
      expect(result.success).toBe(false);
    });

    it("requires refreshToken field", () => {
      const result = refreshTokenSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("logoutSchema", () => {
    it("validates logout request", () => {
      const result = logoutSchema.safeParse({
        everywhere: true,
      });
      expect(result.success).toBe(true);
    });

    it("defaults everywhere to false", () => {
      const result = logoutSchema.parse({});
      expect(result.everywhere).toBe(false);
    });

    it("validates logout without everywhere", () => {
      const result = logoutSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("getChallengeSchema", () => {
    it("validates challenge request", () => {
      const result = getChallengeSchema.safeParse({
        pubkey: "02" + "a".repeat(64),
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid pubkey", () => {
      const result = getChallengeSchema.safeParse({
        pubkey: "invalid",
      });
      expect(result.success).toBe(false);
    });

    it("requires pubkey field", () => {
      const result = getChallengeSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("verifySignatureSchema", () => {
    const validData = {
      pubkey: "02" + "a".repeat(64),
      signature: "304402201234...",
      message: "message-to-verify",
    };

    it("validates signature verification", () => {
      const result = verifySignatureSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("rejects invalid pubkey", () => {
      const result = verifySignatureSchema.safeParse({
        ...validData,
        pubkey: "short",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty signature", () => {
      const result = verifySignatureSchema.safeParse({
        ...validData,
        signature: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty message", () => {
      const result = verifySignatureSchema.safeParse({
        ...validData,
        message: "",
      });
      expect(result.success).toBe(false);
    });

    it("requires all three fields", () => {
      const result = verifySignatureSchema.safeParse({
        pubkey: "02" + "a".repeat(64),
      });
      expect(result.success).toBe(false);
    });
  });
});
