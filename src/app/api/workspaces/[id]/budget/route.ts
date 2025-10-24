import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  TransactionType,
  TransactionStatus,
  WorkspaceActivityAction,
  WorkspaceRole,
} from "@prisma/client";
import type { ApiResponse } from "@/types/api";

/**
 * @swagger
 * /api/workspaces/{id}/budget:
 *   get:
 *     tags: [Workspaces]
 *     summary: Get workspace budget
 *     description: Retrieve current workspace budget and transaction summary
 *     security:
 *       - NostrAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Budget information retrieved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Workspace not found
 *   post:
 *     tags: [Workspaces]
 *     summary: Deposit funds to budget
 *     description: Add funds to workspace budget (admin/owner only)
 *     security:
 *       - NostrAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 1
 *               memo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Funds deposited successfully
 *       400:
 *         description: Invalid amount
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */

/**
 * Schema for depositing funds to workspace budget
 */
const depositSchema = z.object({
  amount: z.number().int().positive().min(1, "Amount must be at least 1 sat"),
  memo: z.string().optional(),
});

type DepositRequest = z.infer<typeof depositSchema>;

interface DepositResponse {
  transaction: {
    id: string;
    type: TransactionType;
    amount: string;
    status: TransactionStatus;
    memo: string | null;
    createdAt: string;
  };
  budget: {
    totalBudget: string;
    availableBudget: string;
    reservedBudget: string;
    paidBudget: string;
  };
}

/**
 * POST /api/workspaces/[id]/budget
 * Deposit funds into workspace budget
 * @permission OWNER, ADMIN
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<DepositResponse>>> {
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

    // Parse and validate request body
    const body = await request.json();
    const validation = depositSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed",
            details: {
              errors: validation.error.issues.map((err) => ({
                field: err.path.join("."),
                message: err.message,
                code: err.code,
              })),
            },
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 422 }
      );
    }

    const { amount, memo }: DepositRequest = validation.data;

    // Check workspace existence and user membership
    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId, deletedAt: null },
      include: {
        members: {
          where: { userPubkey },
        },
        budget: true,
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

    const member = workspace.members[0];

    // Permission check: Only OWNER or ADMIN can deposit funds
    if (member.role !== WorkspaceRole.OWNER && member.role !== WorkspaceRole.ADMIN) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only workspace owners and admins can deposit funds",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    // Create transaction and update budget in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the transaction record
      const transaction = await tx.transaction.create({
        data: {
          workspaceId,
          type: TransactionType.DEPOSIT,
          amount,
          fromUserPubkey: userPubkey,
          status: TransactionStatus.COMPLETED,
          memo,
          completedAt: new Date(),
        },
      });

      // Update or create budget
      const budget = await tx.workspaceBudget.upsert({
        where: { workspaceId },
        create: {
          workspaceId,
          totalBudget: amount,
          availableBudget: amount,
          reservedBudget: 0,
          paidBudget: 0,
        },
        update: {
          totalBudget: {
            increment: amount,
          },
          availableBudget: {
            increment: amount,
          },
        },
      });

      // Log activity
      await tx.workspaceActivity.create({
        data: {
          workspaceId,
          userPubkey,
          action: WorkspaceActivityAction.BUDGET_DEPOSITED,
          details: {
            amount,
            transactionId: transaction.id,
            memo,
          },
        },
      });

      return { transaction, budget };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          transaction: {
            id: result.transaction.id,
            type: result.transaction.type,
            amount: result.transaction.amount.toString(),
            status: result.transaction.status,
            memo: result.transaction.memo,
            createdAt: result.transaction.createdAt.toISOString(),
          },
          budget: {
            totalBudget: result.budget.totalBudget.toString(),
            availableBudget: result.budget.availableBudget.toString(),
            reservedBudget: result.budget.reservedBudget.toString(),
            paidBudget: result.budget.paidBudget.toString(),
          },
        },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Budget deposit error:", error);
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
