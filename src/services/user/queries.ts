import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { PaginationParams, SortParams } from "@/types";

export type UserFilters = {
  search?: string;
  githubVerified?: boolean;
  twitterVerified?: boolean;
};

export type UserSortParams = SortParams & {
  sortBy?: "createdAt" | "updatedAt" | "username" | "lastLogin";
};

export const userQueries = {
  /**
   * Get all users with optional filters, pagination, and sorting
   */
  async getAll(
    filters?: UserFilters,
    pagination?: PaginationParams,
    sort?: UserSortParams
  ) {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const sortBy = sort?.sortBy ?? "createdAt";
    const sortOrder = sort?.sortOrder ?? "desc";

    // Build where clause
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (filters?.search) {
      where.OR = [
        { username: { contains: filters.search, mode: "insensitive" } },
        { alias: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters?.githubVerified !== undefined) {
      where.githubVerified = filters.githubVerified;
    }

    if (filters?.twitterVerified !== undefined) {
      where.twitterVerified = filters.twitterVerified;
    }

    // Execute queries
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          pubkey: true,
          username: true,
          alias: true,
          description: true,
          avatarUrl: true,
          githubUsername: true,
          githubVerified: true,
          twitterUsername: true,
          twitterVerified: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
        },
      }),
      db.user.count({ where }),
    ]);

    return {
      data: users,
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
   * Get a single user by pubkey
   */
  async getByPubkey(pubkey: string) {
    const user = await db.user.findUnique({
      where: { pubkey, deletedAt: null },
      include: {
        _count: {
          select: {
            createdWorkspaces: {
              where: { deletedAt: null },
            },
            memberships: true,
            createdBounties: {
              where: { deletedAt: null },
            },
            assignedBounties: {
              where: { deletedAt: null },
            },
            submittedProofs: true,
          },
        },
      },
    });

    return user;
  },

  /**
   * Get a single user by username
   */
  async getByUsername(username: string) {
    const user = await db.user.findUnique({
      where: { username, deletedAt: null },
      include: {
        _count: {
          select: {
            createdWorkspaces: {
              where: { deletedAt: null },
            },
            memberships: true,
            createdBounties: {
              where: { deletedAt: null },
            },
            assignedBounties: {
              where: { deletedAt: null },
            },
            submittedProofs: true,
          },
        },
      },
    });

    return user;
  },

  /**
   * Get user profile with detailed stats
   */
  async getProfileByPubkey(pubkey: string) {
    const user = await db.user.findUnique({
      where: { pubkey, deletedAt: null },
    });

    if (!user) {
      return null;
    }

    // Get detailed counts and stats
    const [
      workspacesOwned,
      workspaceMemberships,
      bountiesCreated,
      bountiesAssigned,
      bountiesCompleted,
      proofsSubmitted,
      proofsAccepted,
    ] = await Promise.all([
      db.workspace.count({
        where: {
          ownerPubkey: pubkey,
          deletedAt: null,
        },
      }),
      db.workspaceMember.count({
        where: { userPubkey: pubkey },
      }),
      db.bounty.count({
        where: {
          creatorPubkey: pubkey,
          deletedAt: null,
        },
      }),
      db.bounty.count({
        where: {
          assigneePubkey: pubkey,
          deletedAt: null,
        },
      }),
      db.bounty.count({
        where: {
          assigneePubkey: pubkey,
          status: "COMPLETED",
          deletedAt: null,
        },
      }),
      db.bountyProof.count({
        where: { submittedByPubkey: pubkey },
      }),
      db.bountyProof.count({
        where: {
          submittedByPubkey: pubkey,
          status: "ACCEPTED",
        },
      }),
    ]);

    return {
      ...user,
      stats: {
        workspacesOwned,
        workspaceMemberships,
        bountiesCreated,
        bountiesAssigned,
        bountiesCompleted,
        proofsSubmitted,
        proofsAccepted,
      },
    };
  },

  /**
   * Search users by query
   */
  async search(query: string, pagination?: PaginationParams) {
    return userQueries.getAll({ search: query }, pagination);
  },

  /**
   * Get users with verified GitHub accounts
   */
  async getGithubVerified(pagination?: PaginationParams) {
    return userQueries.getAll({ githubVerified: true }, pagination);
  },

  /**
   * Get users with verified Twitter accounts
   */
  async getTwitterVerified(pagination?: PaginationParams) {
    return userQueries.getAll({ twitterVerified: true }, pagination);
  },

  /**
   * Check if username is available
   */
  async isUsernameAvailable(username: string, excludePubkey?: string) {
    const existingUser = await db.user.findUnique({
      where: { username, deletedAt: null },
      select: { pubkey: true },
    });

    if (!existingUser) {
      return true;
    }

    // If excludePubkey is provided, check if it's the same user
    if (excludePubkey && existingUser.pubkey === excludePubkey) {
      return true;
    }

    return false;
  },

  /**
   * Check if pubkey exists
   */
  async existsByPubkey(pubkey: string) {
    const user = await db.user.findUnique({
      where: { pubkey, deletedAt: null },
      select: { id: true },
    });

    return !!user;
  },
};
