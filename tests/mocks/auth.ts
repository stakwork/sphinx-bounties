import type { User } from "@prisma/client";
import { generateTestPubkey } from "../utils";

export const mockUser = (overrides?: Partial<User>): User => {
  const pubkey = overrides?.pubkey || generateTestPubkey();
  const timestamp = Date.now();

  return {
    id: overrides?.id || `user_${timestamp}`,
    pubkey,
    username: overrides?.username || `user_${timestamp}`,
    alias: overrides?.alias || "Mock User",
    description: overrides?.description || null,
    avatarUrl: overrides?.avatarUrl || null,
    contactKey: overrides?.contactKey || null,
    routeHint: overrides?.routeHint || null,
    priceToMeet: overrides?.priceToMeet || null,
    githubUsername: overrides?.githubUsername || null,
    githubVerified: overrides?.githubVerified || false,
    twitterUsername: overrides?.twitterUsername || null,
    twitterVerified: overrides?.twitterVerified || false,
    createdAt: overrides?.createdAt || new Date(),
    updatedAt: overrides?.updatedAt || new Date(),
    lastLogin: overrides?.lastLogin || null,
    deletedAt: overrides?.deletedAt || null,
  };
};

export const mockAuthChallenge = (overrides?: {
  k1?: string;
  pubkey?: string;
  used?: boolean;
  expiresAt?: Date;
}) => {
  const k1 = overrides?.k1 || `challenge_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  return {
    id: `challenge_${Date.now()}`,
    k1,
    pubkey: overrides?.pubkey || null,
    used: overrides?.used || false,
    expiresAt: overrides?.expiresAt || new Date(Date.now() + 5 * 60 * 1000),
    createdAt: new Date(),
  };
};

export const mockAuthHeaders = (pubkey?: string) => {
  return {
    "x-user-pubkey": pubkey || generateTestPubkey(),
    "Content-Type": "application/json",
  };
};
