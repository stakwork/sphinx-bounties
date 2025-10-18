import { describe, it, expect, vi, beforeEach } from "vitest";
import { userQueries } from "@/services/user/queries";
import { db } from "@/lib/db";

// Mock the db module
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

describe("userQueries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    const mockUsers = [
      {
        id: "user1",
        pubkey: "02" + "a".repeat(64),
        username: "alice",
        alias: "Alice",
        description: "Developer",
        avatarUrl: "https://example.com/alice.png",
        githubUsername: "alice",
        githubVerified: true,
        twitterUsername: "alice",
        twitterVerified: false,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        lastLogin: new Date("2024-01-10"),
      },
      {
        id: "user2",
        pubkey: "03" + "b".repeat(64),
        username: "bob",
        alias: "Bob",
        description: "Designer",
        avatarUrl: null,
        githubUsername: null,
        githubVerified: false,
        twitterUsername: null,
        twitterVerified: false,
        createdAt: new Date("2024-01-02"),
        updatedAt: new Date("2024-01-02"),
        lastLogin: new Date("2024-01-08"),
      },
    ];

    it("returns all users with default pagination", async () => {
      vi.mocked(db.user.findMany) // @ts-expect-error - Mock data
        .mockResolvedValue(mockUsers);
      vi.mocked(db.user.count).mockResolvedValue(2);

      const result = await userQueries.getAll();

      expect(result.data).toEqual(mockUsers);
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 20,
        total: 2,
        totalPages: 1,
        hasMore: false,
      });
      expect(db.user.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 0,
        take: 20,
        orderBy: { createdAt: "desc" },
        select: expect.any(Object),
      });
    });

    it("applies custom pagination", async () => {
      vi.mocked(db.user.findMany) // @ts-expect-error - Mock data
        .mockResolvedValue([mockUsers[0]]);
      vi.mocked(db.user.count).mockResolvedValue(50);

      const result = await userQueries.getAll(undefined, { page: 3, pageSize: 15 });

      expect(result.pagination).toEqual({
        page: 3,
        pageSize: 15,
        total: 50,
        totalPages: 4,
        hasMore: true,
      });
      expect(db.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 30,
          take: 15,
        })
      );
    });

    it("filters by search query", async () => {
      vi.mocked(db.user.findMany) // @ts-expect-error - Mock data
        .mockResolvedValue([mockUsers[0]]);
      vi.mocked(db.user.count).mockResolvedValue(1);

      await userQueries.getAll({ search: "alice" });

      expect(db.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { username: { contains: "alice", mode: "insensitive" } },
              { alias: { contains: "alice", mode: "insensitive" } },
              { description: { contains: "alice", mode: "insensitive" } },
            ],
          }),
        })
      );
    });

    it("filters by githubVerified", async () => {
      vi.mocked(db.user.findMany) // @ts-expect-error - Mock data
        .mockResolvedValue([mockUsers[0]]);
      vi.mocked(db.user.count).mockResolvedValue(1);

      await userQueries.getAll({ githubVerified: true });

      expect(db.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            githubVerified: true,
          }),
        })
      );
    });

    it("filters by twitterVerified", async () => {
      vi.mocked(db.user.findMany).mockResolvedValue([]);
      vi.mocked(db.user.count).mockResolvedValue(0);

      await userQueries.getAll({ twitterVerified: true });

      expect(db.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            twitterVerified: true,
          }),
        })
      );
    });

    it("applies custom sorting", async () => {
      vi.mocked(db.user.findMany) // @ts-expect-error - Mock data
        .mockResolvedValue(mockUsers);
      vi.mocked(db.user.count).mockResolvedValue(2);

      await userQueries.getAll(undefined, undefined, { sortBy: "username", sortOrder: "asc" });

      expect(db.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { username: "asc" },
        })
      );
    });

    it("combines multiple filters", async () => {
      vi.mocked(db.user.findMany) // @ts-expect-error - Mock data
        .mockResolvedValue([mockUsers[0]]);
      vi.mocked(db.user.count).mockResolvedValue(1);

      await userQueries.getAll({
        search: "developer",
        githubVerified: true,
      });

      expect(db.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
            githubVerified: true,
            OR: expect.any(Array),
          }),
        })
      );
    });
  });

  describe("getByPubkey", () => {
    const mockUser = {
      id: "user1",
      pubkey: "02" + "a".repeat(64),
      username: "alice",
      alias: "Alice",
      _count: {
        createdWorkspaces: 2,
        memberships: 3,
        createdBounties: 5,
        assignedBounties: 1,
        proofs: 1,
      },
    };

    it("returns user by pubkey", async () => {
      vi.mocked(db.user.findUnique) // @ts-expect-error - Mock data
        .mockResolvedValue(mockUser);

      const result = await userQueries.getByPubkey("02" + "a".repeat(64));

      expect(result).toEqual(mockUser);
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { pubkey: "02" + "a".repeat(64), deletedAt: null },
        include: expect.any(Object),
      });
    });

    it("returns null for non-existent user", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      const result = await userQueries.getByPubkey("nonexistent");

      expect(result).toBeNull();
    });

    it("excludes deleted users", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      await userQueries.getByPubkey("deleted-user");

      expect(db.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        })
      );
    });
  });

  describe("getByUsername", () => {
    const mockUser = {
      id: "user1",
      pubkey: "02" + "a".repeat(64),
      username: "alice",
      alias: "Alice",
      _count: {
        createdWorkspaces: 2,
        memberships: 3,
        createdBounties: 5,
        assignedBounties: 1,
        proofs: 1,
      },
    };

    it("returns user by username", async () => {
      vi.mocked(db.user.findUnique) // @ts-expect-error - Mock data
        .mockResolvedValue(mockUser);

      const result = await userQueries.getByUsername("alice");

      expect(result).toEqual(mockUser);
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { username: "alice", deletedAt: null },
        include: expect.any(Object),
      });
    });

    it("returns null for non-existent username", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      const result = await userQueries.getByUsername("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("search", () => {
    it("delegates to getAll with search filter", async () => {
      const mockUsers = [{ id: "user1", username: "alice" }];
      vi.mocked(db.user.findMany) // @ts-expect-error - Mock data
        .mockResolvedValue(mockUsers);
      vi.mocked(db.user.count).mockResolvedValue(1);

      await userQueries.search("alice");

      expect(db.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });
  });

  describe("isUsernameAvailable", () => {
    it("returns true when username is available", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      const result = await userQueries.isUsernameAvailable("newuser");

      expect(result).toBe(true);
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: {
          username: "newuser",
          deletedAt: null,
        },
        select: {
          pubkey: true,
        },
      });
    });

    it("returns false when username is taken", async () => {
      // @ts-expect-error - Mock data doesn't need all Prisma model fields
      vi.mocked(db.user.findUnique).mockResolvedValue({ pubkey: "pub1" });

      const result = await userQueries.isUsernameAvailable("alice");

      expect(result).toBe(false);
    });

    it("excludes specific pubkey when checking availability", async () => {
      const excludePubkey = "02" + "a".repeat(64);
      // @ts-expect-error - Mock data doesn't need all Prisma model fields
      vi.mocked(db.user.findUnique).mockResolvedValue({ pubkey: excludePubkey });

      const result = await userQueries.isUsernameAvailable("alice", excludePubkey);

      expect(result).toBe(true);
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: {
          username: "alice",
          deletedAt: null,
        },
        select: {
          pubkey: true,
        },
      });
    });
  });

  describe("existsByPubkey", () => {
    it("returns true when user exists", async () => {
      // @ts-expect-error - Mock data doesn't need all Prisma model fields
      vi.mocked(db.user.findUnique).mockResolvedValue({ id: 1 });

      const result = await userQueries.existsByPubkey("02" + "a".repeat(64));

      expect(result).toBe(true);
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: {
          pubkey: "02" + "a".repeat(64),
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });
    });

    it("returns false when user does not exist", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      const result = await userQueries.existsByPubkey("nonexistent");

      expect(result).toBe(false);
    });
  });
});
