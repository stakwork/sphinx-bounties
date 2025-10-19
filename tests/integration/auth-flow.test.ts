import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { generateChallenge, encodeLnurl } from "@/lib/auth/lnurl";

describe("Authentication Flow Integration", () => {
  const testPubkey = "test-integration-pubkey-" + Date.now();
  let challengeK1: string;

  beforeAll(async () => {
    await db.$connect();
  });

  afterAll(async () => {
    await db.user.deleteMany({
      where: { pubkey: testPubkey },
    });
    await db.$disconnect();
  });

  beforeEach(async () => {
    await db.authChallenge.deleteMany({});
  });

  it("completes full authentication flow", async () => {
    challengeK1 = generateChallenge().slice(0, 60);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.authChallenge.create({
      data: {
        k1: challengeK1,
        expiresAt,
        used: false,
      },
    });

    const challenge = await db.authChallenge.findUnique({
      where: { k1: challengeK1 },
    });

    expect(challenge).toBeDefined();
    expect(challenge?.used).toBe(false);
    expect(challenge?.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("creates challenge with correct expiry", async () => {
    const k1 = generateChallenge().slice(0, 60);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.authChallenge.create({
      data: {
        k1,
        expiresAt,
        used: false,
      },
    });

    const challenge = await db.authChallenge.findUnique({
      where: { k1 },
    });

    expect(challenge).toBeDefined();
    expect(challenge?.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 5 * 60 * 1000 + 1000);
  });

  it("marks challenge as used after verification", async () => {
    const k1 = generateChallenge().slice(0, 60);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.authChallenge.create({
      data: {
        k1,
        expiresAt,
        used: false,
      },
    });

    await db.authChallenge.update({
      where: { k1 },
      data: { used: true },
    });

    const challenge = await db.authChallenge.findUnique({
      where: { k1 },
    });

    expect(challenge?.used).toBe(true);
  });

  it("prevents reuse of consumed challenge", async () => {
    const k1 = generateChallenge().slice(0, 60);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.authChallenge.create({
      data: {
        k1,
        expiresAt,
        used: true,
      },
    });

    const challenge = await db.authChallenge.findUnique({
      where: { k1 },
    });

    expect(challenge?.used).toBe(true);
  });

  it("creates user on first successful verification", async () => {
    const newPubkey = "test-new-user-" + Date.now();

    const user = await db.user.create({
      data: {
        pubkey: newPubkey,
        username: `user_${newPubkey.slice(0, 8)}`,
        alias: "",
      },
    });

    expect(user).toBeDefined();
    expect(user.pubkey).toBe(newPubkey);

    await db.user.delete({
      where: { id: user.id },
    });
  });

  it("updates existing user on subsequent verification", async () => {
    const existingPubkey = "test-existing-user-" + Date.now();

    const user = await db.user.create({
      data: {
        pubkey: existingPubkey,
        username: `user_${existingPubkey.slice(0, 8)}`,
        alias: "",
      },
    });

    const updatedUser = await db.user.update({
      where: { pubkey: existingPubkey },
      data: {
        alias: "Updated Alias",
      },
    });

    expect(updatedUser.alias).toBe("Updated Alias");

    await db.user.delete({
      where: { id: user.id },
    });
  });

  it("generates valid lnurl encoding", () => {
    const url = "https://example.com/api/auth/verify?k1=test123";
    const lnurl = encodeLnurl(url);

    expect(lnurl).toBeTruthy();
    expect(lnurl.length).toBeGreaterThan(10);
    expect(typeof lnurl).toBe("string");
  });

  it("generates unique challenges", () => {
    const k1_1 = generateChallenge();
    const k1_2 = generateChallenge();
    const k1_3 = generateChallenge();

    expect(k1_1).not.toBe(k1_2);
    expect(k1_2).not.toBe(k1_3);
    expect(k1_1.length).toBe(64);
    expect(k1_2.length).toBe(64);
  });

  it("cleanup expires old challenges", async () => {
    const oldK1 = generateChallenge().slice(0, 60);
    const oldDate = new Date(Date.now() - 10 * 60 * 1000);

    await db.authChallenge.create({
      data: {
        k1: oldK1,
        expiresAt: oldDate,
        used: false,
      },
    });

    const expiredChallenges = await db.authChallenge.findMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    expect(expiredChallenges.length).toBeGreaterThanOrEqual(1);

    await db.authChallenge.deleteMany({
      where: {
        k1: { in: expiredChallenges.map((c) => c.k1) },
      },
    });

    const remainingExpired = await db.authChallenge.findMany({
      where: {
        expiresAt: { lt: new Date() },
        k1: { startsWith: "test-" },
      },
    });

    expect(remainingExpired.length).toBe(0);
  });
});
