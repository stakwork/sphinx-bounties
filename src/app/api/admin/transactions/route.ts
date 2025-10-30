import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiPaginated, apiError, validateQuery } from "@/lib/api";
import { db } from "@/lib/db";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";

const listTransactionsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.string().optional(),
  workspaceId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const validation = validateQuery(searchParams, listTransactionsSchema);
    if (validation.error) return validation.error;

    const q = validation.data!;

    const where: Record<string, unknown> = {};
    if (q.status) where.status = q.status;
    if (q.workspaceId) where.workspaceId = q.workspaceId;

    const skip = (q.page - 1) * q.limit;

    const [total, transactions] = await Promise.all([
      db.transaction.count({ where }),
      db.transaction.findMany({ where, skip, take: q.limit, orderBy: { createdAt: "desc" } }),
    ]);

    const rows = transactions.map((t) => ({
      id: t.id,
      workspaceId: t.workspaceId,
      bountyId: t.bountyId,
      type: t.type,
      status: t.status,
      amount: t.amount,
      createdAt: t.createdAt.toISOString(),
    }));

    return apiPaginated(rows, { page: q.page, pageSize: q.limit, totalCount: total });
  } catch (error) {
    logApiError(error as Error, {
      url: request.url,
      method: request.method,
    });
    return apiError(
      { code: ErrorCode.INTERNAL_SERVER_ERROR, message: "Failed to fetch transactions" },
      500
    );
  }
}
