import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { updatePaymentStatusSchema } from "@/validations/bounty.schema";
import { ERROR_MESSAGES } from "@/lib/error-constants";
import {
  TransactionType,
  TransactionStatus,
  BountyActivityAction,
  WorkspaceRole,
} from "@prisma/client";
import type { UpdatePaymentStatusResponse } from "@/types/bounty";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const validationResult = updatePaymentStatusSchema.safeParse({ ...body, bountyId });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid payment status data",
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
          },
        },
        transactions: {
          where: { type: TransactionType.PAYMENT },
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
            message: "Only workspace admins or owners can update payment status",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    if (bounty.transactions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_TRANSACTION",
            message: "No payment transaction found for this bounty",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 404 }
      );
    }

    const transaction = bounty.transactions[0];

    if (transaction.status !== TransactionStatus.PENDING) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TRANSACTION_STATUS",
            message: `Cannot update transaction with status: ${transaction.status}. Only PENDING transactions can be updated.`,
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    const { status, errorMessage, paymentHash, preimage } = validationResult.data;

    const updatedTransaction = await db.$transaction(async (tx) => {
      const updateData: {
        status: TransactionStatus;
        completedAt?: Date;
        errorMessage?: string | null;
        paymentHash?: string | null;
        preimage?: string | null;
      } = {
        status,
      };

      if (status === TransactionStatus.COMPLETED) {
        updateData.completedAt = new Date();
        if (paymentHash) updateData.paymentHash = paymentHash;
        if (preimage) updateData.preimage = preimage;
      } else if (status === TransactionStatus.FAILED) {
        updateData.errorMessage = errorMessage || "Payment failed";

        await tx.workspaceBudget.update({
          where: { workspaceId: bounty.workspaceId },
          data: {
            reservedBudget: { increment: bounty.amount },
            paidBudget: { decrement: bounty.amount },
          },
        });

        await tx.bounty.update({
          where: { id: bountyId },
          data: {
            paidAt: null,
          },
        });
      }

      const updated = await tx.transaction.update({
        where: { id: transaction.id },
        data: updateData,
      });

      await tx.bountyActivity.create({
        data: {
          bountyId,
          userPubkey,
          action:
            status === TransactionStatus.COMPLETED
              ? BountyActivityAction.PAID
              : BountyActivityAction.UPDATED,
          details: {
            transactionId: updated.id,
            oldStatus: TransactionStatus.PENDING,
            newStatus: status,
            ...(status === TransactionStatus.COMPLETED
              ? { paymentHash, preimage }
              : { errorMessage }),
          },
        },
      });

      return updated;
    });

    const response: UpdatePaymentStatusResponse = {
      message: `Payment status updated to ${status}`,
      transaction: {
        id: updatedTransaction.id,
        status: updatedTransaction.status,
        completedAt: updatedTransaction.completedAt?.toISOString() || null,
        errorMessage: updatedTransaction.errorMessage,
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
    console.error("Error updating payment status:", error);
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
