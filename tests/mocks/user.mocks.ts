/**
 * Mock data and factories for user-related tests
 */

import type { User } from "@prisma/client";

/**
 * Create mock user data
 */
export const createMockUser = (overrides?: Partial<User>): User => {
  const timestamp = Date.now();
  return {
    id: `user-${timestamp}`,
    pubkey: "02" + "1".repeat(64),
    username: `testuser_${timestamp}`,
    alias: "Test User",
    description: null,
    avatarUrl: null,
    contactKey: null,
    routeHint: null,
    priceToMeet: null,
    githubUsername: null,
    githubVerified: false,
    twitterUsername: null,
    twitterVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: null,
    deletedAt: null,
    ...overrides,
  };
};

/**
 * Create multiple mock users
 */
export const createMockUsers = (count: number): User[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockUser({
      pubkey: `02${"1".repeat(63)}${i}`,
      username: `testuser_${Date.now()}_${i}`,
    })
  );
};

/**
 * Valid user creation payload
 */
export const validUserPayload = {
  pubkey: "02" + "1".repeat(64),
  username: "validusername",
  alias: "Valid User",
};

/**
 * Invalid user payloads for validation testing
 */
export const invalidUserPayloads = {
  usernameTooShort: {
    pubkey: "02" + "1".repeat(64),
    username: "ab",
    alias: "Valid User",
  },
  usernameTooLong: {
    pubkey: "02" + "1".repeat(64),
    username: "a".repeat(21),
    alias: "Valid User",
  },
  usernameInvalidChars: {
    pubkey: "02" + "1".repeat(64),
    username: "invalid user!",
    alias: "Valid User",
  },
  pubkeyTooShort: {
    pubkey: "02" + "1".repeat(30),
    username: "validusername",
    alias: "Valid User",
  },
  pubkeyInvalidPrefix: {
    pubkey: "04" + "1".repeat(64),
    username: "validusername",
    alias: "Valid User",
  },
};
