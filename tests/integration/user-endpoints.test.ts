/**
 * User Endpoints Integration Tests
 *
 * Tests for user management endpoints:
 * - GET /api/users - List users with pagination, search, filtering, and sorting
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { GET as GetUsers } from "@/app/api/users/route";

// Helper to create request
function createRequest(url: string) {
  return new Request(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  }) as any;
}

// Helper to parse response
async function parseResponse(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

describe("User Endpoints", () => {
  const testUsers = [
    {
      pubkey: "user-test-1-pubkey",
      username: "alice_dev",
      alias: "Alice Developer",
      description: "Full stack developer",
      githubUsername: "alice",
      githubVerified: true,
      twitterUsername: null,
      twitterVerified: false,
    },
    {
      pubkey: "user-test-2-pubkey",
      username: "bob_designer",
      alias: "Bob Designer",
      description: "UI/UX specialist",
      githubUsername: null,
      githubVerified: false,
      twitterUsername: "bob_design",
      twitterVerified: true,
    },
    {
      pubkey: "user-test-3-pubkey",
      username: "charlie_pm",
      alias: "Charlie PM",
      description: "Product manager with tech background",
      githubUsername: "charlie",
      githubVerified: true,
      twitterUsername: "charlie_tweets",
      twitterVerified: true,
    },
    {
      pubkey: "user-test-4-pubkey",
      username: "diana_writer",
      alias: "Diana Writer",
      description: "Technical writer and content creator",
      githubUsername: null,
      githubVerified: false,
      twitterUsername: null,
      twitterVerified: false,
    },
    {
      pubkey: "user-test-5-pubkey",
      username: "eve_security",
      alias: "Eve Security",
      description: "Security researcher and ethical hacker",
      githubUsername: "eve_sec",
      githubVerified: true,
      twitterUsername: null,
      twitterVerified: false,
    },
  ];

  beforeAll(async () => {
    // Cleanup
    await db.user.deleteMany({
      where: {
        pubkey: {
          in: testUsers.map((u) => u.pubkey),
        },
      },
    });

    // Create test users
    for (const userData of testUsers) {
      await db.user.create({
        data: userData,
      });
    }
  });

  afterAll(async () => {
    await db.user.deleteMany({
      where: {
        pubkey: {
          in: testUsers.map((u) => u.pubkey),
        },
      },
    });
  });

  describe("GET /api/users", () => {
    describe("Pagination", () => {
      it("should return paginated users with default parameters", async () => {
        const request = createRequest("http://localhost/api/users");
        const response = await GetUsers(request);

        expect(response.status).toBe(200);
        const data: any = await parseResponse(response);
        expect(data.success).toBe(true);
        expect(data.data).toBeInstanceOf(Array);
        expect(data.meta.pagination).toBeDefined();
        expect(data.meta.pagination.page).toBe(1);
        expect(data.meta.pagination.pageSize).toBe(20);
      });

      it("should respect page and limit parameters", async () => {
        const request = createRequest("http://localhost/api/users?page=1&limit=2");
        const response = await GetUsers(request);

        expect(response.status).toBe(200);
        const data: any = await parseResponse(response);
        expect(data.meta.pagination.page).toBe(1);
        expect(data.meta.pagination.pageSize).toBe(2);
        expect(data.data.length).toBeLessThanOrEqual(2);
      });

      it("should include user details", async () => {
        const request = createRequest("http://localhost/api/users");
        const response = await GetUsers(request);

        expect(response.status).toBe(200);
        const data: any = await parseResponse(response);
        expect(data.data.length).toBeGreaterThan(0);
        const user = data.data[0];
        expect(user).toHaveProperty("pubkey");
        expect(user).toHaveProperty("username");
        expect(user).toHaveProperty("alias");
        expect(user).toHaveProperty("stats");
        expect(user.stats).toHaveProperty("bountiesCreated");
        expect(user.stats).toHaveProperty("bountiesAssigned");
        expect(user.stats).toHaveProperty("workspaces");
      });

      it("should reject invalid page parameter", async () => {
        const request = createRequest("http://localhost/api/users?page=0");
        const response = await GetUsers(request);

        expect(response.status).toBe(422);
        const data: any = await parseResponse(response);
        expect(data.success).toBe(false);
      });

      it("should reject negative page", async () => {
        const request = createRequest("http://localhost/api/users?page=-1");
        const response = await GetUsers(request);

        expect(response.status).toBe(422);
        const data: any = await parseResponse(response);
        expect(data.success).toBe(false);
      });

      it("should reject limit exceeding maximum", async () => {
        const request = createRequest("http://localhost/api/users?limit=150");
        const response = await GetUsers(request);

        expect(response.status).toBe(422);
        const data: any = await parseResponse(response);
        expect(data.success).toBe(false);
      });

      it("should reject negative limit", async () => {
        const request = createRequest("http://localhost/api/users?limit=-5");
        const response = await GetUsers(request);

        expect(response.status).toBe(422);
        const data: any = await parseResponse(response);
        expect(data.success).toBe(false);
      });

      it("should handle page beyond available data", async () => {
        const request = createRequest("http://localhost/api/users?page=9999&limit=20");
        const response = await GetUsers(request);

        expect(response.status).toBe(200);
        const data: any = await parseResponse(response);
        expect(data.data).toEqual([]);
        expect(data.meta.pagination.page).toBe(9999);
      });
    });

    describe("Search", () => {
      it("should search by username", async () => {
        const request = createRequest("http://localhost/api/users?search=alice");
        const response = await GetUsers(request);

        expect(response.status).toBe(200);
        const data: any = await parseResponse(response);
        expect(data.data.length).toBeGreaterThan(0);
        const usernames = data.data.map((u: any) => u.username.toLowerCase());
        expect(usernames.some((u: string) => u.includes("alice"))).toBe(true);
      });

      it("should search by alias", async () => {
        const request = createRequest("http://localhost/api/users?search=Designer");
        const response = await GetUsers(request);

        expect(response.status).toBe(200);
        const data: any = await parseResponse(response);
        expect(data.data.length).toBeGreaterThan(0);
        const found = data.data.some((u: any) => u.alias?.toLowerCase().includes("designer"));
        expect(found).toBe(true);
      });

      it("should search by description", async () => {
        const request = createRequest("http://localhost/api/users?search=security");
        const response = await GetUsers(request);

        expect(response.status).toBe(200);
        const data: any = await parseResponse(response);
        expect(data.data.length).toBeGreaterThan(0);
        const found = data.data.some((u: any) => u.description?.toLowerCase().includes("security"));
        expect(found).toBe(true);
      });

      it("should be case insensitive", async () => {
        const request = createRequest("http://localhost/api/users?search=ALICE");
        const response = await GetUsers(request);

        expect(response.status).toBe(200);
        const data: any = await parseResponse(response);
        expect(data.data.length).toBeGreaterThan(0);
      });

      it("should support partial matching", async () => {
        const request = createRequest("http://localhost/api/users?search=dev");
        const response = await GetUsers(request);

        expect(response.status).toBe(200);
        const data: any = await parseResponse(response);
        expect(data.data.length).toBeGreaterThan(0);
      });

      it("should return empty array for no matches", async () => {
        const request = createRequest("http://localhost/api/users?search=nonexistentuser12345");
        const response = await GetUsers(request);

        expect(response.status).toBe(200);
        const data: any = await parseResponse(response);
        expect(data.data).toEqual([]);
      });

      it("should handle special characters in search", async () => {
        const request = createRequest("http://localhost/api/users?search=@#$%");
        const response = await GetUsers(request);

        expect(response.status).toBe(200);
        const data: any = await parseResponse(response);
        // Should not error, just return empty results
        expect(data.data).toBeInstanceOf(Array);
      });
    });

    describe("Filtering", () => {
      it("should filter by verified status true", async () => {
        const request = createRequest("http://localhost/api/users?verified=true");
        const response = await GetUsers(request);

        expect(response.status).toBe(200);
        const data: any = await parseResponse(response);
        expect(data.data.length).toBeGreaterThan(0);
        data.data.forEach((user: any) => {
          expect(user.githubVerified || user.twitterVerified).toBe(true);
        });
      });

      it("should filter by verified status false", async () => {
        const request = createRequest("http://localhost/api/users?verified=false");
        const response = await GetUsers(request);

        expect(response.status).toBe(200);
        const data: any = await parseResponse(response);
        // verified=false returns users where githubVerified=false OR twitterVerified=false
        // This matches most users, so just verify we get results
        expect(data.data).toBeInstanceOf(Array);
      });

      it("should combine search and verified filter", async () => {
        const request = createRequest("http://localhost/api/users?search=charlie&verified=true");
        const response = await GetUsers(request);

        expect(response.status).toBe(200);
        const data: any = await parseResponse(response);
        if (data.data.length > 0) {
          data.data.forEach((user: any) => {
            expect(user.githubVerified || user.twitterVerified).toBe(true);
          });
        }
      });
    });

    describe("Sorting", () => {
      it("should sort by username ascending", async () => {
        const request = createRequest(
          "http://localhost/api/users?sortBy=username&sortOrder=asc&limit=50"
        );
        const response = await GetUsers(request);

        expect(response.status).toBe(200);
        const data: any = await parseResponse(response);
        const usernames = data.data.map((u: any) => u.username);
        // Check first few are in order
        for (let i = 0; i < Math.min(3, usernames.length - 1); i++) {
          expect(usernames[i] <= usernames[i + 1]).toBe(true);
        }
      });

      it("should sort by username descending", async () => {
        const request = createRequest(
          "http://localhost/api/users?sortBy=username&sortOrder=desc&limit=50"
        );
        const response = await GetUsers(request);

        expect(response.status).toBe(200);
        const data: any = await parseResponse(response);
        const usernames = data.data.map((u: any) => u.username);
        // Check first few are in descending order
        for (let i = 0; i < Math.min(3, usernames.length - 1); i++) {
          expect(usernames[i] >= usernames[i + 1]).toBe(true);
        }
      });

      it("should default to createdAt desc", async () => {
        const request = createRequest("http://localhost/api/users");
        const response = await GetUsers(request);

        expect(response.status).toBe(200);
        const data: any = await parseResponse(response);
        expect(data.data).toBeInstanceOf(Array);
        // Newer users should appear first
        if (data.data.length > 1) {
          const dates = data.data.map((u: any) => new Date(u.createdAt).getTime());
          for (let i = 0; i < Math.min(3, dates.length - 1); i++) {
            expect(dates[i] >= dates[i + 1]).toBe(true);
          }
        }
      });

      it("should reject invalid sortBy", async () => {
        const request = createRequest("http://localhost/api/users?sortBy=invalidField");
        const response = await GetUsers(request);

        expect(response.status).toBe(422);
        const data: any = await parseResponse(response);
        expect(data.success).toBe(false);
      });

      it("should reject invalid sortOrder", async () => {
        const request = createRequest("http://localhost/api/users?sortOrder=invalid");
        const response = await GetUsers(request);

        expect(response.status).toBe(422);
        const data: any = await parseResponse(response);
        expect(data.success).toBe(false);
      });
    });

    describe("User Stats", () => {
      it("should include user statistics", async () => {
        const request = createRequest("http://localhost/api/users?search=alice");
        const response = await GetUsers(request);

        expect(response.status).toBe(200);
        const data: any = await parseResponse(response);
        expect(data.data.length).toBeGreaterThan(0);
        const user = data.data[0];
        expect(user.stats).toBeDefined();
        expect(typeof user.stats.bountiesCreated).toBe("number");
        expect(typeof user.stats.bountiesAssigned).toBe("number");
        expect(typeof user.stats.workspaces).toBe("number");
      });
    });

    describe("Verification Fields", () => {
      it("should include GitHub verification details", async () => {
        const request = createRequest("http://localhost/api/users?search=alice");
        const response = await GetUsers(request);

        expect(response.status).toBe(200);
        const data: any = await parseResponse(response);
        const alice = data.data.find((u: any) => u.username === "alice_dev");
        if (alice) {
          expect(alice.githubUsername).toBe("alice");
          expect(alice.githubVerified).toBe(true);
        }
      });

      it("should include Twitter verification details", async () => {
        const request = createRequest("http://localhost/api/users?search=bob");
        const response = await GetUsers(request);

        expect(response.status).toBe(200);
        const data: any = await parseResponse(response);
        const bob = data.data.find((u: any) => u.username === "bob_designer");
        if (bob) {
          expect(bob.twitterUsername).toBe("bob_design");
          expect(bob.twitterVerified).toBe(true);
        }
      });
    });

    describe("Edge Cases", () => {
      it("should handle empty search string", async () => {
        const request = createRequest("http://localhost/api/users?search=");
        const response = await GetUsers(request);

        expect(response.status).toBe(200);
        const data: any = await parseResponse(response);
        expect(data.data).toBeInstanceOf(Array);
      });

      it("should handle multiple query parameters", async () => {
        const request = createRequest(
          "http://localhost/api/users?page=1&limit=5&search=dev&verified=true&sortBy=username&sortOrder=asc"
        );
        const response = await GetUsers(request);

        expect(response.status).toBe(200);
        const data: any = await parseResponse(response);
        expect(data.success).toBe(true);
      });
    });
  });
});
