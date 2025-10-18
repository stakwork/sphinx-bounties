import { db } from "@/lib/db";
import { Prisma, WorkspaceRole } from "@prisma/client";
import type { PaginationParams, SortParams } from "@/types";

export type WorkspaceFilters = {
  ownerPubkey?: string;
  search?: string;
  hasActiveBounties?: boolean;
};

export type WorkspaceSortParams = SortParams & {
  sortBy?: "createdAt" | "updatedAt" | "name";
};

export const workspaceQueries = {
  /**
   * Get all workspaces with optional filters, pagination, and sorting
   */
  async getAll(
    filters?: WorkspaceFilters,
    pagination?: PaginationParams,
    sort?: WorkspaceSortParams
  ) {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const sortBy = sort?.sortBy ?? "createdAt";
    const sortOrder = sort?.sortOrder ?? "desc";

    // Build where clause
    const where: Prisma.WorkspaceWhereInput = {
      deletedAt: null,
    };

    if (filters?.ownerPubkey) {
      where.ownerPubkey = filters.ownerPubkey;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { mission: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters?.hasActiveBounties) {
      where.bounties = {
        some: {
          status: {
            in: ["OPEN", "ASSIGNED", "IN_REVIEW"],
          },
          deletedAt: null,
        },
      };
    }

    // Execute queries
    const [workspaces, total] = await Promise.all([
      db.workspace.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          owner: {
            select: {
              pubkey: true,
              username: true,
              alias: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              members: true,
              bounties: {
                where: { deletedAt: null },
              },
            },
          },
        },
      }),
      db.workspace.count({ where }),
    ]);

    return {
      data: workspaces,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total,
      },
    };
  },

  /**
   * Get a single workspace by ID
   */
  async getById(id: string) {
    const workspace = await db.workspace.findUnique({
      where: { id, deletedAt: null },
      include: {
        owner: {
          select: {
            pubkey: true,
            username: true,
            alias: true,
            avatarUrl: true,
            description: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                pubkey: true,
                username: true,
                alias: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
        },
        budget: true,
        _count: {
          select: {
            bounties: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    return workspace;
  },

  /**
   * Get workspaces owned by a user
   */
  async getByOwnerPubkey(
    ownerPubkey: string,
    pagination?: PaginationParams,
    sort?: WorkspaceSortParams
  ) {
    return workspaceQueries.getAll({ ownerPubkey }, pagination, sort);
  },

  /**
   * Get workspaces where user is a member
   */
  async getByMemberPubkey(
    userPubkey: string,
    pagination?: PaginationParams,
    sort?: WorkspaceSortParams
  ) {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const sortBy = sort?.sortBy ?? "createdAt";
    const sortOrder = sort?.sortOrder ?? "desc";

    const [memberships, total] = await Promise.all([
      db.workspaceMember.findMany({
        where: { userPubkey },
        skip,
        take,
        include: {
          workspace: {
            include: {
              owner: {
                select: {
                  pubkey: true,
                  username: true,
                  alias: true,
                  avatarUrl: true,
                },
              },
              _count: {
                select: {
                  members: true,
                  bounties: {
                    where: { deletedAt: null },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          workspace: { [sortBy]: sortOrder },
        },
      }),
      db.workspaceMember.count({
        where: {
          userPubkey,
          workspace: { deletedAt: null },
        },
      }),
    ]);

    const workspaces = memberships
      .map((m) => ({
        ...m.workspace,
        memberRole: m.role,
      }))
      .filter((w) => w.deletedAt === null);

    return {
      data: workspaces,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total,
      },
    };
  },

  /**
   * Get workspace members by workspace ID
   */
  async getMembersByWorkspaceId(workspaceId: string) {
    const members = await db.workspaceMember.findMany({
      where: { workspaceId },
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

    return members;
  },

  /**
   * Check if user has specific role in workspace
   */
  async getUserRole(workspaceId: string, userPubkey: string) {
    const member = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userPubkey: {
          workspaceId,
          userPubkey,
        },
      },
      select: {
        role: true,
      },
    });

    return member?.role ?? null;
  },

  /**
   * Check if user is admin or owner of workspace
   */
  async isAdminOrOwner(workspaceId: string, userPubkey: string) {
    const role = await workspaceQueries.getUserRole(workspaceId, userPubkey);
    return role === WorkspaceRole.ADMIN || role === WorkspaceRole.OWNER;
  },

  /**
   * Get workspace budget
   */
  async getBudget(workspaceId: string) {
    const budget = await db.workspaceBudget.findUnique({
      where: { workspaceId },
    });

    return budget;
  },
};
