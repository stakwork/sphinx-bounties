import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import type { TransactionType } from "@prisma/client";
import type { ApiResponse } from "@/types/api";

/**
 * @swagger
 * /api/workspaces/{id}/transactions:
 *   get:
 *     tags: [Workspaces]
 *     summary: List workspace transactions
 *     description: Get paginated transaction history for a workspace
 *     security:
 *       - NostrAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Paginated list of transactions
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Workspace not found
 */

interface Transaction {
  id: string;
  type: TransactionType;
  amount: string;
  fromUserPubkey: string | null;
  toUserPubkey: string | null;
  status: string;
  memo: string | null;
  createdAt: string;
  completedAt: string | null;
  bounty: {
    id: string;
    title: string;
  } | null;
  fromUser: {
    pubkey: string;
    username: string;
    alias: string | null;
  } | null;
  toUser: {
    pubkey: string;
    username: string;
    alias: string | null;
  } | null;
}

interface TransactionsResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

/**
 * GET /api/workspaces/[id]/transactions
 * List all workspace transactions with pagination and filtering
 * @permission All members can view transactions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<TransactionsResponse>>> {
  try {
    const { id: workspaceId } = await params;
    const userPubkey = request.headers.get("x-user-pubkey");

    // Authentication check
    if (!userPubkey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 401 }
      );
    }

    // Check workspace membership
    const workspace = await db.workspace.findUnique({
      where: {
        id: workspaceId,
        deletedAt: null,
      },
      include: {
        members: {
          where: {
            userPubkey,
          },
        },
      },
    });

    if (!workspace || workspace.members.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Workspace not found or you are not a member",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 404 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("perPage") || "20")));
    const type = searchParams.get("type") as TransactionType | null;

    // Build where clause
    const where = {
      workspaceId,
      ...(type && { type }),
    };

    // Get total count and transactions
    const [total, transactions] = await Promise.all([
      db.transaction.count({ where }),
      db.transaction.findMany({
        where,
        include: {
          bounty: {
            select: {
              id: true,
              title: true,
            },
          },
          fromUser: {
            select: {
              pubkey: true,
              username: true,
              alias: true,
            },
          },
          toUser: {
            select: {
              pubkey: true,
              username: true,
              alias: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    const totalPages = Math.ceil(total / perPage);

    return NextResponse.json(
      {
        success: true,
        data: {
          transactions: transactions.map((t) => ({
            id: t.id,
            type: t.type,
            amount: t.amount.toString(),
            fromUserPubkey: t.fromUserPubkey,
            toUserPubkey: t.toUserPubkey,
            status: t.status,
            memo: t.memo,
            createdAt: t.createdAt.toISOString(),
            completedAt: t.completedAt?.toISOString() || null,
            bounty: t.bounty,
            fromUser: t.fromUser,
            toUser: t.toUser,
          })),
          pagination: {
            page,
            perPage,
            total,
            totalPages,
          },
        },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Transactions list error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 500 }
    );
  }
}
