import { describe, it, expect, vi, beforeEach } from "vitest";
import { workspaceQueries } from "@/services/workspace/queries";
import { db } from "@/lib/db";
import { WorkspaceRole } from "@prisma/client";

// Mock the db module
vi.mock("@/lib/db", () => ({
  db: {
    workspace: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
    },
    workspaceMember: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe("workspaceQueries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    const mockWorkspaces = [
      {
        id: "ws1",
        name: "Workspace 1",
        description: "First workspace",
        owner: { pubkey: "pub1", username: "owner1", alias: "Owner 1", avatarUrl: null },
        _count: { members: 5, bounties: 10 },
      },
      {
        id: "ws2",
        name: "Workspace 2",
        description: "Second workspace",
        owner: { pubkey: "pub2", username: "owner2", alias: "Owner 2", avatarUrl: null },
        _count: { members: 3, bounties: 5 },
      },
    ];

    it("returns all workspaces with default pagination", async () => {
      // @ts-expect-error - Mock data
      vi.mocked(db.workspace.findMany).mockResolvedValue(mockWorkspaces);
      vi.mocked(db.workspace.count).mockResolvedValue(2);

      const result = await workspaceQueries.getAll();

      expect(result.data).toEqual(mockWorkspaces);
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 20,
        total: 2,
        totalPages: 1,
        hasMore: false,
      });
      expect(db.workspace.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 0,
        take: 20,
        orderBy: { createdAt: "desc" },
        include: expect.any(Object),
      });
    });

    it("applies custom pagination", async () => {
      // @ts-expect-error - Mock data
      vi.mocked(db.workspace.findMany).mockResolvedValue([mockWorkspaces[0]]);
      vi.mocked(db.workspace.count).mockResolvedValue(30);

      const result = await workspaceQueries.getAll(undefined, { page: 2, pageSize: 15 });

      expect(result.pagination).toEqual({
        page: 2,
        pageSize: 15,
        total: 30,
        totalPages: 2,
        hasMore: false,
      });
      expect(db.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 15,
          take: 15,
        })
      );
    });

    it("filters by ownerPubkey", async () => {
      // @ts-expect-error - Mock data
      vi.mocked(db.workspace.findMany).mockResolvedValue([mockWorkspaces[0]]);
      vi.mocked(db.workspace.count).mockResolvedValue(1);

      await workspaceQueries.getAll({ ownerPubkey: "pub1" });

      expect(db.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ownerPubkey: "pub1",
          }),
        })
      );
    });

    it("filters by search query", async () => {
      // @ts-expect-error - Mock data
      vi.mocked(db.workspace.findMany).mockResolvedValue([mockWorkspaces[0]]);
      vi.mocked(db.workspace.count).mockResolvedValue(1);

      await workspaceQueries.getAll({ search: "First" });

      expect(db.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: "First", mode: "insensitive" } },
              { description: { contains: "First", mode: "insensitive" } },
              { mission: { contains: "First", mode: "insensitive" } },
            ],
          }),
        })
      );
    });

    it("filters by hasActiveBounties", async () => {
      // @ts-expect-error - Mock data
      vi.mocked(db.workspace.findMany).mockResolvedValue([mockWorkspaces[0]]);
      vi.mocked(db.workspace.count).mockResolvedValue(1);

      await workspaceQueries.getAll({ hasActiveBounties: true });

      expect(db.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            bounties: {
              some: {
                status: {
                  in: ["OPEN", "ASSIGNED", "IN_REVIEW"],
                },
                deletedAt: null,
              },
            },
          }),
        })
      );
    });

    it("applies custom sorting", async () => {
      // @ts-expect-error - Mock data
      vi.mocked(db.workspace.findMany).mockResolvedValue(mockWorkspaces);
      vi.mocked(db.workspace.count).mockResolvedValue(2);

      await workspaceQueries.getAll(undefined, undefined, { sortBy: "name", sortOrder: "asc" });

      expect(db.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: "asc" },
        })
      );
    });

    it("combines multiple filters", async () => {
      // @ts-expect-error - Mock data
      vi.mocked(db.workspace.findMany).mockResolvedValue([mockWorkspaces[0]]);
      vi.mocked(db.workspace.count).mockResolvedValue(1);

      await workspaceQueries.getAll({
        ownerPubkey: "pub1",
        search: "workspace",
        hasActiveBounties: true,
      });

      expect(db.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
            ownerPubkey: "pub1",
            OR: expect.any(Array),
            bounties: expect.any(Object),
          }),
        })
      );
    });
  });

  describe("getById", () => {
    const mockWorkspace = {
      id: "ws1",
      name: "Workspace 1",
      description: "First workspace",
      owner: { pubkey: "pub1", username: "owner1" },
      members: [],
      _count: { members: 5, bounties: 10 },
    };

    it("returns workspace by id", async () => {
      // @ts-expect-error - Mock data
      vi.mocked(db.workspace.findUnique).mockResolvedValue(mockWorkspace);

      const result = await workspaceQueries.getById("ws1");

      expect(result).toEqual(mockWorkspace);
      expect(db.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: "ws1", deletedAt: null },
        include: expect.any(Object),
      });
    });

    it("returns null for non-existent workspace", async () => {
      vi.mocked(db.workspace.findUnique).mockResolvedValue(null);

      const result = await workspaceQueries.getById("nonexistent");

      expect(result).toBeNull();
    });

    it("excludes deleted workspaces", async () => {
      vi.mocked(db.workspace.findUnique).mockResolvedValue(null);

      await workspaceQueries.getById("deleted-workspace");

      expect(db.workspace.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        })
      );
    });
  });

  describe("getUserRole", () => {
    it("returns OWNER role when user is owner", async () => {
      // @ts-expect-error - Mock data
      vi.mocked(db.workspaceMember.findUnique).mockResolvedValue({
        role: WorkspaceRole.OWNER,
      });

      const result = await workspaceQueries.getUserRole("ws1", "pub1");

      expect(result).toBe(WorkspaceRole.OWNER);
    });

    it("returns member role from membership", async () => {
      // @ts-expect-error - Mock data
      vi.mocked(db.workspace.findUnique).mockResolvedValue({
        ownerPubkey: "pub1",
      });
      // @ts-expect-error - Mock data
      vi.mocked(db.workspaceMember.findUnique).mockResolvedValue({
        role: WorkspaceRole.ADMIN,
      });

      const result = await workspaceQueries.getUserRole("ws1", "pub2");

      expect(result).toBe(WorkspaceRole.ADMIN);
    });

    it("returns null when user has no role", async () => {
      vi.mocked(db.workspaceMember.findUnique).mockResolvedValue(null);

      const result = await workspaceQueries.getUserRole("ws1", "pub3");

      expect(result).toBeNull();
    });

    it("returns null when workspace not found", async () => {
      vi.mocked(db.workspaceMember.findUnique).mockResolvedValue(null);

      const result = await workspaceQueries.getUserRole("nonexistent", "pub1");

      expect(result).toBeNull();
    });
  });

  describe("isAdminOrOwner", () => {
    it("returns true when user is owner", async () => {
      // @ts-expect-error - Mock data doesn't need all Prisma model fields
      vi.mocked(db.workspaceMember.findUnique).mockResolvedValue({
        role: WorkspaceRole.OWNER,
      });

      const result = await workspaceQueries.isAdminOrOwner("ws1", "pub1");

      expect(result).toBe(true);
    });
    it("returns true when user is admin", async () => {
      // @ts-expect-error - Mock data
      vi.mocked(db.workspace.findUnique).mockResolvedValue({
        ownerPubkey: "pub1",
      });
      // @ts-expect-error - Mock data
      vi.mocked(db.workspaceMember.findUnique).mockResolvedValue({
        role: WorkspaceRole.ADMIN,
      });

      const result = await workspaceQueries.isAdminOrOwner("ws1", "pub2");

      expect(result).toBe(true);
    });

    it("returns false when user is contributor", async () => {
      // @ts-expect-error - Mock data
      vi.mocked(db.workspace.findUnique).mockResolvedValue({
        ownerPubkey: "pub1",
      });
      // @ts-expect-error - Mock data
      vi.mocked(db.workspaceMember.findUnique).mockResolvedValue({
        role: WorkspaceRole.CONTRIBUTOR,
      });

      const result = await workspaceQueries.isAdminOrOwner("ws1", "pub2");

      expect(result).toBe(false);
    });

    it("returns false when user has no role", async () => {
      // @ts-expect-error - Mock data
      vi.mocked(db.workspace.findUnique).mockResolvedValue({
        ownerPubkey: "pub1",
      });
      vi.mocked(db.workspaceMember.findUnique).mockResolvedValue(null);

      const result = await workspaceQueries.isAdminOrOwner("ws1", "pub3");

      expect(result).toBe(false);
    });
  });

  describe("getMembersByWorkspaceId", () => {
    const mockMembers = [
      {
        id: "mem1",
        role: WorkspaceRole.ADMIN,
        user: { pubkey: "pub1", username: "user1", alias: "User 1" },
      },
      {
        id: "mem2",
        role: WorkspaceRole.CONTRIBUTOR,
        user: { pubkey: "pub2", username: "user2", alias: "User 2" },
      },
    ];

    it("returns workspace members", async () => {
      // @ts-expect-error - Mock data
      vi.mocked(db.workspaceMember.findMany).mockResolvedValue(mockMembers);

      const result = await workspaceQueries.getMembersByWorkspaceId("ws1");

      expect(result).toEqual(mockMembers);
      expect(db.workspaceMember.findMany).toHaveBeenCalledWith({
        where: { workspaceId: "ws1" },
        include: {
          user: {
            select: {
              pubkey: true,
              username: true,
              alias: true,
              avatarUrl: true,
              description: true,
            },
          },
        },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      });
    });
  });
});
