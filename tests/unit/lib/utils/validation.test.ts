import { describe, it, expect } from "vitest";
import {
  isValidPubkey,
  isValidUsername,
  isValidEmail,
  isValidUrl,
  isValidGithubUrl,
  isValidTwitterHandle,
  sanitizeUsername,
  sanitizeTwitterHandle,
  extractGithubUsername,
  isPositiveInteger,
  isValidSatsAmount,
} from "@/lib/utils/validation";

describe("Validation Utils", () => {
  describe("isValidPubkey", () => {
    it("validates correct 66-char hex pubkey", () => {
      const pubkey = "02" + "a".repeat(64);
      expect(isValidPubkey(pubkey)).toBe(true);
    });

    it("rejects short pubkey", () => {
      expect(isValidPubkey("02abc")).toBe(false);
    });

    it("rejects long pubkey", () => {
      const pubkey = "02" + "a".repeat(65);
      expect(isValidPubkey(pubkey)).toBe(false);
    });

    it("rejects non-hex characters", () => {
      const pubkey = "02" + "g".repeat(64);
      expect(isValidPubkey(pubkey)).toBe(false);
    });
  });

  describe("isValidUsername", () => {
    it("validates correct username", () => {
      expect(isValidUsername("user123")).toBe(true);
    });

    it("validates underscore", () => {
      expect(isValidUsername("user_123")).toBe(true);
    });

    it("rejects short username", () => {
      expect(isValidUsername("ab")).toBe(false);
    });

    it("rejects long username", () => {
      expect(isValidUsername("a".repeat(21))).toBe(false);
    });

    it("rejects special characters", () => {
      expect(isValidUsername("user-123")).toBe(false);
      expect(isValidUsername("user.123")).toBe(false);
    });
  });

  describe("isValidEmail", () => {
    it("validates correct email", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
    });

    it("rejects email without @", () => {
      expect(isValidEmail("testexample.com")).toBe(false);
    });

    it("rejects email without domain", () => {
      expect(isValidEmail("test@")).toBe(false);
    });

    it("rejects email without TLD", () => {
      expect(isValidEmail("test@example")).toBe(false);
    });
  });

  describe("isValidUrl", () => {
    it("validates correct URL", () => {
      expect(isValidUrl("https://example.com")).toBe(true);
    });

    it("validates http URL", () => {
      expect(isValidUrl("http://example.com")).toBe(true);
    });

    it("rejects invalid URL", () => {
      expect(isValidUrl("not-a-url")).toBe(false);
    });

    it("rejects URL without protocol", () => {
      expect(isValidUrl("example.com")).toBe(false);
    });
  });

  describe("isValidGithubUrl", () => {
    it("validates correct GitHub URL", () => {
      expect(isValidGithubUrl("https://github.com/username")).toBe(true);
    });

    it("validates with www", () => {
      expect(isValidGithubUrl("https://www.github.com/username")).toBe(true);
    });

    it("rejects non-GitHub URL", () => {
      expect(isValidGithubUrl("https://gitlab.com/username")).toBe(false);
    });

    it("rejects repo URL (only org)", () => {
      expect(isValidGithubUrl("https://github.com/username/repo")).toBe(false);
    });
  });

  describe("isValidTwitterHandle", () => {
    it("validates correct handle", () => {
      expect(isValidTwitterHandle("username")).toBe(true);
    });

    it("validates handle with @", () => {
      expect(isValidTwitterHandle("@username")).toBe(true);
    });

    it("validates handle with numbers", () => {
      expect(isValidTwitterHandle("user123")).toBe(true);
    });

    it("rejects long handle", () => {
      expect(isValidTwitterHandle("a".repeat(16))).toBe(false);
    });

    it("rejects special characters", () => {
      expect(isValidTwitterHandle("user-name")).toBe(false);
    });
  });

  describe("sanitizeUsername", () => {
    it("removes special characters", () => {
      expect(sanitizeUsername("user-123!")).toBe("user123");
    });

    it("truncates to 20 chars", () => {
      expect(sanitizeUsername("a".repeat(30))).toHaveLength(20);
    });

    it("keeps valid characters", () => {
      expect(sanitizeUsername("user_123")).toBe("user_123");
    });
  });

  describe("sanitizeTwitterHandle", () => {
    it("removes @ prefix", () => {
      expect(sanitizeTwitterHandle("@username")).toBe("username");
    });

    it("removes special characters", () => {
      expect(sanitizeTwitterHandle("user-name")).toBe("username");
    });

    it("truncates to 15 chars", () => {
      expect(sanitizeTwitterHandle("a".repeat(20))).toHaveLength(15);
    });
  });

  describe("extractGithubUsername", () => {
    it("extracts username from GitHub URL", () => {
      expect(extractGithubUsername("https://github.com/username")).toBe("username");
    });

    it("extracts from repo URL", () => {
      expect(extractGithubUsername("https://github.com/username/repo")).toBe("username");
    });

    it("returns null for invalid URL", () => {
      expect(extractGithubUsername("https://gitlab.com/username")).toBe(null);
    });
  });

  describe("isPositiveInteger", () => {
    it("validates positive integers", () => {
      expect(isPositiveInteger(1)).toBe(true);
      expect(isPositiveInteger(100)).toBe(true);
    });

    it("rejects zero", () => {
      expect(isPositiveInteger(0)).toBe(false);
    });

    it("rejects negative numbers", () => {
      expect(isPositiveInteger(-1)).toBe(false);
    });

    it("rejects floats", () => {
      expect(isPositiveInteger(1.5)).toBe(false);
    });
  });

  describe("isValidSatsAmount", () => {
    it("validates amount within range", () => {
      expect(isValidSatsAmount(1000, 100, 10000)).toBe(true);
    });

    it("rejects amount below min", () => {
      expect(isValidSatsAmount(50, 100, 10000)).toBe(false);
    });

    it("rejects amount above max", () => {
      expect(isValidSatsAmount(20000, 100, 10000)).toBe(false);
    });

    it("validates amount at boundaries", () => {
      expect(isValidSatsAmount(100, 100, 10000)).toBe(true);
      expect(isValidSatsAmount(10000, 100, 10000)).toBe(true);
    });
  });
});
