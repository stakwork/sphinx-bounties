import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ERROR_MESSAGES } from "@/lib/error-constants";
import type { UserBountiesResponse } from "@/types/user";
import { BountyStatus } from "@prisma/client";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(BountyStatus).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pubkey: string }> }
) {
  try {
    const { pubkey } = await params;
    const { searchParams } = new URL(request.url);

    const queryResult = querySchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      status: searchParams.get("status"),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: queryResult.error.issues,
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    const { page, limit, status } = queryResult.data;
    const skip = (page - 1) * limit;

    const user = await db.user.findUnique({
      where: {
        pubkey,
        deletedAt: null,
      },
      select: { pubkey: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "User not found",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 404 }
      );
    }

    const where = {
      creatorPubkey: pubkey,
      deletedAt: null,
      ...(status && { status }),
    };

    const [bounties, total] = await Promise.all([
      db.bounty.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
          assignee: {
            select: {
              pubkey: true,
              username: true,
              alias: true,
            },
          },
        },
      }),
      db.bounty.count({ where }),
    ]);

    const response: UserBountiesResponse = {
      bounties: bounties.map((bounty) => ({
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
        assignee: bounty.assignee,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: response,
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching created bounties:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 500 }
    );
  }
}
