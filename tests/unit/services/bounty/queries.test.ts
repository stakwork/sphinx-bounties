import { describe, it, expect, vi, beforeEach } from "vitest";
import { bountyQueries } from "@/services/bounty/queries";
import { db } from "@/lib/db";
import { BountyStatus } from "@prisma/client";

// Mock the db module
vi.mock("@/lib/db", () => ({
  db: {
    bounty: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe("bountyQueries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    const now = new Date();
    const mockBounties = [
      {
        id: "bounty1",
        title: "Build a feature",
        description: "Description",
        amount: 50000,
        status: BountyStatus.OPEN,
        workspace: { id: "ws1", name: "Workspace 1", avatarUrl: null },
        assignee: null,
        creator: { pubkey: "pub1", username: "user1", alias: "User 1", avatarUrl: null },
        _count: { proofs: 0 },
        createdAt: now,
        updatedAt: now,
        estimatedCompletionDate: null,
      },
      {
        id: "bounty2",
        title: "Fix a bug",
        description: "Bug description",
        amount: 20000,
        status: BountyStatus.ASSIGNED,
        workspace: { id: "ws1", name: "Workspace 1", avatarUrl: null },
        assignee: { pubkey: "pub2", username: "user2", alias: "User 2", avatarUrl: null },
        creator: { pubkey: "pub1", username: "user1", alias: "User 1", avatarUrl: null },
        _count: { proofs: 1 },
        createdAt: now,
        updatedAt: now,
        estimatedCompletionDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    ];

    it("returns all bounties with default pagination", async () => {
      // @ts-expect-error - Mock data doesn't need all fields
      vi.mocked(db.bounty.findMany).mockResolvedValue(mockBounties);
      vi.mocked(db.bounty.count).mockResolvedValue(2);

      const result = await bountyQueries.getAll();

      // Expect serialized dates (ISO strings)
      expect(result.data).toEqual([
        {
          ...mockBounties[0],
          createdAt: mockBounties[0].createdAt.toISOString(),
          updatedAt: mockBounties[0].updatedAt.toISOString(),
          estimatedCompletionDate: null,
        },
        {
          ...mockBounties[1],
          createdAt: mockBounties[1].createdAt.toISOString(),
          updatedAt: mockBounties[1].updatedAt.toISOString(),
          estimatedCompletionDate: mockBounties[1].estimatedCompletionDate?.toISOString(),
        },
      ]);
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 20,
        total: 2,
        totalPages: 1,
        hasMore: false,
      });
      expect(db.bounty.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 0,
        take: 20,
        orderBy: { createdAt: "desc" },
        include: expect.any(Object),
      });
    });

    it("applies custom pagination", async () => {
      // @ts-expect-error - Mock data doesn't need all fields
      vi.mocked(db.bounty.findMany).mockResolvedValue([mockBounties[0]]);
      vi.mocked(db.bounty.count).mockResolvedValue(50);

      const result = await bountyQueries.getAll(undefined, { page: 2, pageSize: 10 });

      expect(result.pagination).toEqual({
        page: 2,
        pageSize: 10,
        total: 50,
        totalPages: 5,
        hasMore: true,
      });
      expect(db.bounty.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it("filters by status", async () => {
      vi.mocked(db.bounty.findMany) // @ts-expect-error - Mock data
        .mockResolvedValue([mockBounties[0]]);
      vi.mocked(db.bounty.count).mockResolvedValue(1);

      await bountyQueries.getAll({ status: BountyStatus.OPEN });

      expect(db.bounty.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: BountyStatus.OPEN,
          }),
        })
      );
    });

    it("filters by workspaceId", async () => {
      vi.mocked(db.bounty.findMany) // @ts-expect-error - Mock data
        .mockResolvedValue([mockBounties[0]]);
      vi.mocked(db.bounty.count).mockResolvedValue(1);

      await bountyQueries.getAll({ workspaceId: "ws1" });

      expect(db.bounty.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            workspaceId: "ws1",
          }),
        })
      );
    });

    it("filters by assigneePubkey", async () => {
      vi.mocked(db.bounty.findMany) // @ts-expect-error - Mock data
        .mockResolvedValue([mockBounties[1]]);
      vi.mocked(db.bounty.count).mockResolvedValue(1);

      await bountyQueries.getAll({ assigneePubkey: "pub2" });

      expect(db.bounty.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assigneePubkey: "pub2",
          }),
        })
      );
    });

    it("filters by creatorPubkey", async () => {
      vi.mocked(db.bounty.findMany) // @ts-expect-error - Mock data
        .mockResolvedValue(mockBounties);
      vi.mocked(db.bounty.count).mockResolvedValue(2);

      await bountyQueries.getAll({ creatorPubkey: "pub1" });

      expect(db.bounty.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            creatorPubkey: "pub1",
          }),
        })
      );
    });

    it("filters by search query", async () => {
      vi.mocked(db.bounty.findMany) // @ts-expect-error - Mock data
        .mockResolvedValue([mockBounties[0]]);
      vi.mocked(db.bounty.count).mockResolvedValue(1);

      await bountyQueries.getAll({ search: "feature" });

      expect(db.bounty.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: "feature", mode: "insensitive" } },
              { description: { contains: "feature", mode: "insensitive" } },
            ],
          }),
        })
      );
    });

    it("filters by tags", async () => {
      vi.mocked(db.bounty.findMany) // @ts-expect-error - Mock data
        .mockResolvedValue([mockBounties[0]]);
      vi.mocked(db.bounty.count).mockResolvedValue(1);

      await bountyQueries.getAll({ tags: ["javascript", "react"] });

      expect(db.bounty.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: { hasSome: ["javascript", "react"] },
          }),
        })
      );
    });

    it("filters by programming languages", async () => {
      vi.mocked(db.bounty.findMany) // @ts-expect-error - Mock data
        .mockResolvedValue([mockBounties[0]]);
      vi.mocked(db.bounty.count).mockResolvedValue(1);

      await bountyQueries.getAll({ programmingLanguages: ["JAVASCRIPT", "TYPESCRIPT"] });

      expect(db.bounty.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            codingLanguages: { hasSome: ["JAVASCRIPT", "TYPESCRIPT"] },
          }),
        })
      );
    });

    it("applies custom sorting", async () => {
      vi.mocked(db.bounty.findMany) // @ts-expect-error - Mock data
        .mockResolvedValue(mockBounties);
      vi.mocked(db.bounty.count).mockResolvedValue(2);

      await bountyQueries.getAll(undefined, undefined, { sortBy: "amount", sortOrder: "asc" });

      expect(db.bounty.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { amount: "asc" },
        })
      );
    });

    it("combines multiple filters", async () => {
      vi.mocked(db.bounty.findMany) // @ts-expect-error - Mock data
        .mockResolvedValue([mockBounties[0]]);
      vi.mocked(db.bounty.count).mockResolvedValue(1);

      await bountyQueries.getAll({
        status: BountyStatus.OPEN,
        workspaceId: "ws1",
        search: "feature",
      });

      expect(db.bounty.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
            status: BountyStatus.OPEN,
            workspaceId: "ws1",
            OR: expect.any(Array),
          }),
        })
      );
    });

    it("calculates pagination correctly for last page", async () => {
      vi.mocked(db.bounty.findMany) // @ts-expect-error - Mock data
        .mockResolvedValue([mockBounties[0]]);
      vi.mocked(db.bounty.count).mockResolvedValue(25);

      const result = await bountyQueries.getAll(undefined, { page: 3, pageSize: 10 });

      expect(result.pagination).toEqual({
        page: 3,
        pageSize: 10,
        total: 25,
        totalPages: 3,
        hasMore: false,
      });
    });
  });

  describe("getById", () => {
    const mockBounty = {
      id: "bounty1",
      title: "Build a feature",
      description: "Description",
      amount: 50000,
      workspace: { id: "ws1", name: "Workspace 1" },
      assignee: null,
      creator: { pubkey: "pub1", username: "user1" },
      proofs: [],
    };

    it("returns bounty by id", async () => {
      vi.mocked(db.bounty.findUnique) // @ts-expect-error - Mock data
        .mockResolvedValue(mockBounty);

      const result = await bountyQueries.getById("bounty1");

      expect(result).toEqual(mockBounty);
      expect(db.bounty.findUnique).toHaveBeenCalledWith({
        where: { id: "bounty1", deletedAt: null },
        include: expect.any(Object),
      });
    });

    it("returns null for non-existent bounty", async () => {
      vi.mocked(db.bounty.findUnique).mockResolvedValue(null);

      const result = await bountyQueries.getById("non-existent");

      expect(result).toBeNull();
    });

    it("excludes deleted bounties", async () => {
      vi.mocked(db.bounty.findUnique).mockResolvedValue(null);

      await bountyQueries.getById("deleted-bounty");

      expect(db.bounty.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        })
      );
    });
  });

  describe("getByWorkspaceId", () => {
    it("delegates to getAll with workspaceId filter", async () => {
      const now = new Date();
      const mockBounties = [
        {
          id: "bounty1",
          title: "Bounty 1",
          workspaceId: "ws1",
          createdAt: now,
          updatedAt: now,
          estimatedCompletionDate: null,
        },
        {
          id: "bounty2",
          title: "Bounty 2",
          workspaceId: "ws1",
          createdAt: now,
          updatedAt: now,
          estimatedCompletionDate: null,
        },
      ];
      vi.mocked(db.bounty.findMany) // @ts-expect-error - Mock data
        .mockResolvedValue(mockBounties);
      vi.mocked(db.bounty.count).mockResolvedValue(2);

      await bountyQueries.getByWorkspaceId("ws1");

      expect(db.bounty.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            workspaceId: "ws1",
          }),
        })
      );
    });
  });

  describe("getByAssigneePubkey", () => {
    it("delegates to getAll with assigneePubkey filter", async () => {
      const now = new Date();
      const mockBounties = [
        {
          id: "bounty1",
          assigneePubkey: "pub1",
          createdAt: now,
          updatedAt: now,
          estimatedCompletionDate: null,
        },
      ];
      vi.mocked(db.bounty.findMany) // @ts-expect-error - Mock data
        .mockResolvedValue(mockBounties);
      vi.mocked(db.bounty.count).mockResolvedValue(1);

      await bountyQueries.getByAssigneePubkey("pub1");

      expect(db.bounty.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assigneePubkey: "pub1",
          }),
        })
      );
    });
  });

  describe("getByCreatorPubkey", () => {
    it("delegates to getAll with creatorPubkey filter", async () => {
      const now = new Date();
      const mockBounties = [
        {
          id: "bounty1",
          creatorPubkey: "pub1",
          createdAt: now,
          updatedAt: now,
          estimatedCompletionDate: null,
        },
      ];
      vi.mocked(db.bounty.findMany) // @ts-expect-error - Mock data
        .mockResolvedValue(mockBounties);
      vi.mocked(db.bounty.count).mockResolvedValue(1);

      await bountyQueries.getByCreatorPubkey("pub1");

      expect(db.bounty.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            creatorPubkey: "pub1",
          }),
        })
      );
    });
  });
});
