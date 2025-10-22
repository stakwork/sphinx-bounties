import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processPaymentSchema } from "@/validations/bounty.schema";
import { ERROR_MESSAGES } from "@/lib/error-constants";
import {
  BountyStatus,
  TransactionType,
  TransactionStatus,
  BountyActivityAction,
  WorkspaceRole,
} from "@prisma/client";
import type { ProcessPaymentResponse, GetPaymentResponse } from "@/types/bounty";

/**
 * @swagger
 * /api/bounties/{id}/payment:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment details
 *     description: Retrieve payment transaction for a bounty
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
 *         description: Payment details retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a workspace member
 *       404:
 *         description: Bounty not found
 *   post:
 *     tags: [Payments]
 *     summary: Process payment
 *     description: Initiate Lightning payment for completed bounty (admin/owner only)
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
 *               - lightningInvoice
 *             properties:
 *               lightningInvoice:
 *                 type: string
 *               memo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment initiated successfully
 *       400:
 *         description: Invalid status, already paid, or insufficient budget
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin/owner access required
 *       404:
 *         description: Bounty not found
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bountyId } = await params;
    const userPubkey = request.headers.get("x-user-pubkey");

    if (!userPubkey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: ERROR_MESSAGES.UNAUTHORIZED,
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 401 }
      );
    }

    const bounty = await db.bounty.findUnique({
      where: {
        id: bountyId,
        deletedAt: null,
      },
      include: {
        workspace: {
          include: {
            members: {
              where: { userPubkey },
            },
          },
        },
        assignee: {
          select: {
            pubkey: true,
            username: true,
          },
        },
        transactions: {
          where: { type: TransactionType.PAYMENT },
          include: {
            fromUser: {
              select: {
                pubkey: true,
                username: true,
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
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!bounty) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Bounty not found",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 404 }
      );
    }

    if (bounty.workspace.members.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You must be a workspace member to view payment details",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    const transaction = bounty.transactions[0] || null;

    const response: GetPaymentResponse = {
      transaction: transaction
        ? {
            id: transaction.id,
            bountyId: transaction.bountyId!,
            workspaceId: transaction.workspaceId,
            type: "PAYMENT",
            amount: transaction.amount.toString(),
            status: transaction.status,
            lightningInvoice: transaction.lightningInvoice,
            paymentHash: transaction.paymentHash,
            preimage: transaction.preimage,
            memo: transaction.memo,
            errorMessage: transaction.errorMessage,
            createdAt: transaction.createdAt.toISOString(),
            completedAt: transaction.completedAt?.toISOString() || null,
            fromUser: transaction.fromUser,
            toUser: transaction.toUser,
          }
        : null,
      bounty: {
        id: bounty.id,
        title: bounty.title,
        amount: bounty.amount.toString(),
        status: bounty.status,
        assignee: bounty.assignee,
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
    console.error("Error fetching payment details:", error);
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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bountyId } = await params;
    const userPubkey = request.headers.get("x-user-pubkey");

    if (!userPubkey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: ERROR_MESSAGES.UNAUTHORIZED,
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const validationResult = processPaymentSchema.safeParse({ ...body, bountyId });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid payment data",
            details: validationResult.error.issues,
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    const bounty = await db.bounty.findUnique({
      where: {
        id: bountyId,
        deletedAt: null,
      },
      include: {
        workspace: {
          include: {
            members: {
              where: { userPubkey },
            },
            budget: true,
          },
        },
        proofs: {
          where: { status: "ACCEPTED" },
          orderBy: { reviewedAt: "desc" },
          take: 1,
        },
        transactions: {
          where: { type: TransactionType.PAYMENT },
        },
      },
    });

    if (!bounty) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Bounty not found",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 404 }
      );
    }

    const member = bounty.workspace.members[0];
    if (
      !member ||
      (member.role !== WorkspaceRole.ADMIN && bounty.workspace.ownerPubkey !== userPubkey)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only workspace admins or owners can process payments",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    if (bounty.status !== BountyStatus.COMPLETED) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_STATUS",
            message: `Cannot process payment for bounty with status: ${bounty.status}. Bounty must be COMPLETED.`,
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    if (
      bounty.paidAt ||
      bounty.transactions.some((t) => t.status === TransactionStatus.COMPLETED)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ALREADY_PAID",
            message: "This bounty has already been paid",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    if (!bounty.assigneePubkey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_ASSIGNEE",
            message: "Cannot process payment for bounty without assignee",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    if (bounty.proofs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_ACCEPTED_PROOF",
            message: "Cannot process payment without accepted proof",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    if (!bounty.workspace.budget) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_BUDGET",
            message: "Workspace has no budget configured",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    if (bounty.workspace.budget.reservedBudget < bounty.amount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INSUFFICIENT_RESERVED_BUDGET",
            message: "Insufficient reserved budget to complete payment",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    const { lightningInvoice, memo } = validationResult.data;

    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          workspaceId: bounty.workspaceId,
          bountyId,
          type: TransactionType.PAYMENT,
          amount: bounty.amount,
          fromUserPubkey: null,
          toUserPubkey: bounty.assigneePubkey,
          lightningInvoice,
          status: TransactionStatus.PENDING,
          memo: memo || `Payment for bounty: ${bounty.title}`,
        },
      });

      await tx.workspaceBudget.update({
        where: { workspaceId: bounty.workspaceId },
        data: {
          reservedBudget: { decrement: bounty.amount },
          paidBudget: { increment: bounty.amount },
        },
      });

      await tx.bounty.update({
        where: { id: bountyId },
        data: {
          paidAt: new Date(),
        },
      });

      await tx.bountyActivity.create({
        data: {
          bountyId,
          userPubkey,
          action: BountyActivityAction.PAID,
          details: {
            transactionId: newTransaction.id,
            amount: bounty.amount.toString(),
          },
        },
      });

      return newTransaction;
    });

    const response: ProcessPaymentResponse = {
      message: "Payment initiated successfully",
      transaction: {
        id: transaction.id,
        amount: transaction.amount.toString(),
        status: transaction.status,
        paymentHash: transaction.paymentHash,
        createdAt: transaction.createdAt.toISOString(),
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: response,
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing payment:", error);
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
