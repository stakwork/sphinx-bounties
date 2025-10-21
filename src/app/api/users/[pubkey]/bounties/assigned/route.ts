import type { NextRequest } from "next/server";
import { z } from "zod";
import { validateQuery, apiPaginated, apiError } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";
import { db } from "@/lib/db";
import { BountyStatus } from "@prisma/client";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(BountyStatus).optional(),
  active: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pubkey: string }> }
) {
  const { pubkey } = await params;
  try {
    const { searchParams } = new URL(request.url);

    const validation = validateQuery(searchParams, querySchema);

    if (validation.error) {
      return validation.error;
    }

    const { page, limit, status, active } = validation.data!;
    const skip = (page - 1) * limit;

    const user = await db.user.findUnique({
      where: {
        pubkey,
        deletedAt: null,
      },
      select: { pubkey: true },
    });

    if (!user) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "User not found",
        },
        404
      );
    }

    const where = {
      assigneePubkey: pubkey,
      deletedAt: null,
      ...(status && { status }),
      ...(active && {
        status: {
          in: [BountyStatus.ASSIGNED, BountyStatus.IN_REVIEW],
        },
      }),
    };

    const [bounties, total] = await Promise.all([
      db.bounty.findMany({
        where,
        skip,
        take: limit,
        orderBy: { assignedAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          amount: true,
          status: true,
          tags: true,
          codingLanguages: true,
          createdAt: true,
          completedAt: true,
          workspace: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          creator: {
            select: {
              pubkey: true,
              username: true,
              alias: true,
            },
          },
          proofs: {
            where: {
              submittedByPubkey: pubkey,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            select: {
              status: true,
            },
          },
        },
      }),
      db.bounty.count({ where }),
    ]);

    const mappedBounties = bounties.map((bounty) => ({
      id: bounty.id,
      title: bounty.title,
      description: bounty.description,
      amount: bounty.amount.toString(),
      status: bounty.status,
      tags: bounty.tags,
      codingLanguages: bounty.codingLanguages,
      createdAt: bounty.createdAt.toISOString(),
      completedAt: bounty.completedAt?.toISOString() || null,
      workspace: bounty.workspace,
      creator: bounty.creator,
    }));

    return apiPaginated(mappedBounties, {
      page,
      pageSize: limit,
      totalCount: total,
    });
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/users/${pubkey}/bounties/assigned`,
      method: "GET",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to fetch assigned bounties",
      },
      500
    );
  }
}
