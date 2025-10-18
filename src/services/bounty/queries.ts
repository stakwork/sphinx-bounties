import { db } from "@/lib/db";
import type { BountyStatus, Prisma, ProgrammingLanguage } from "@prisma/client";
import type { PaginationParams, SortParams } from "@/types";

export type BountyFilters = {
  status?: BountyStatus;
  workspaceId?: string;
  assigneePubkey?: string;
  creatorPubkey?: string;
  search?: string;
  tags?: string[];
  programmingLanguages?: string[];
};

export type BountySortParams = SortParams & {
  sortBy?: "createdAt" | "updatedAt" | "amount" | "deadline";
};

export const bountyQueries = {
  async getAll(filters?: BountyFilters, pagination?: PaginationParams, sort?: BountySortParams) {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const sortBy = sort?.sortBy ?? "createdAt";
    const sortOrder = sort?.sortOrder ?? "desc";

    const where: Prisma.BountyWhereInput = {
      deletedAt: null,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.workspaceId) {
      where.workspaceId = filters.workspaceId;
    }

    if (filters?.assigneePubkey) {
      where.assigneePubkey = filters.assigneePubkey;
    }

    if (filters?.creatorPubkey) {
      where.creatorPubkey = filters.creatorPubkey;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    if (filters?.programmingLanguages && filters.programmingLanguages.length > 0) {
      where.codingLanguages = {
        hasSome: filters.programmingLanguages as ProgrammingLanguage[],
      };
    }

    const [bounties, total] = await Promise.all([
      db.bounty.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          assignee: {
            select: {
              pubkey: true,
              username: true,
              alias: true,
              avatarUrl: true,
            },
          },
          creator: {
            select: {
              pubkey: true,
              username: true,
              alias: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              proofs: true,
            },
          },
        },
      }),
      db.bounty.count({ where }),
    ]);

    return {
      data: bounties,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total,
      },
    };
  },

  async getById(id: string) {
    const bounty = await db.bounty.findUnique({
      where: { id, deletedAt: null },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            description: true,
            avatarUrl: true,
            websiteUrl: true,
            githubUrl: true,
            ownerPubkey: true,
          },
        },
        assignee: {
          select: {
            pubkey: true,
            username: true,
            alias: true,
            avatarUrl: true,
            description: true,
            githubUsername: true,
            twitterUsername: true,
          },
        },
        creator: {
          select: {
            pubkey: true,
            username: true,
            alias: true,
            avatarUrl: true,
          },
        },
        proofs: {
          include: {
            submitter: {
              select: {
                pubkey: true,
                username: true,
                alias: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return bounty;
  },

  async getByWorkspaceId(
    workspaceId: string,
    pagination?: PaginationParams,
    sort?: BountySortParams
  ) {
    return bountyQueries.getAll({ workspaceId }, pagination, sort);
  },

  async getByAssigneePubkey(
    assigneePubkey: string,
    pagination?: PaginationParams,
    sort?: BountySortParams
  ) {
    return bountyQueries.getAll({ assigneePubkey }, pagination, sort);
  },

  async getByCreatorPubkey(
    creatorPubkey: string,
    pagination?: PaginationParams,
    sort?: BountySortParams
  ) {
    return bountyQueries.getAll({ creatorPubkey }, pagination, sort);
  },

  async getProofsByBountyId(bountyId: string) {
    const proofs = await db.bountyProof.findMany({
      where: {
        bountyId,
      },
      include: {
        submitter: {
          select: {
            pubkey: true,
            username: true,
            alias: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return proofs;
  },

  async getProofById(proofId: string) {
    const proof = await db.bountyProof.findUnique({
      where: { id: proofId },
      include: {
        bounty: {
          select: {
            id: true,
            title: true,
            workspaceId: true,
          },
        },
        submitter: {
          select: {
            pubkey: true,
            username: true,
            alias: true,
            avatarUrl: true,
          },
        },
      },
    });

    return proof;
  },
};
