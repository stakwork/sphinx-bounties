import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { BountyStatus, BountyActivityAction, WorkspaceRole } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { apiError, apiCreated, apiPaginated, validateBody, validateQuery } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";
import { createBountySchema } from "@/validations/bounty.schema";

/**
 * @swagger
 * /api/workspaces/{id}/bounties:
 *   get:
 *     tags: [Bounties]
 *     summary: List workspace bounties
 *     description: Get paginated list of bounties for a workspace with filtering
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
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, OPEN, ASSIGNED, IN_REVIEW, PAID, COMPLETED, CANCELLED]
 *       - in: query
 *         name: assigneePubkey
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, amount, estimatedCompletionDate, updatedAt]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Paginated list of bounties
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Workspace not found
 *   post:
 *     tags: [Bounties]
 *     summary: Create workspace bounty
 *     description: Create a new bounty in a workspace
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
 *               - title
 *               - amount
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               estimatedHours:
 *                 type: number
 *               estimatedCompletionDate:
 *                 type: string
 *                 format: date-time
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Bounty created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */

const listBountiesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(BountyStatus).optional(),
  assigneePubkey: z.string().optional(),
  tags: z
    .string()
    .transform((val) => (val ? val.split(",").map((t) => t.trim()) : undefined))
    .optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["createdAt", "amount", "estimatedCompletionDate", "updatedAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params;
  try {
    const userPubkey = request.headers.get("x-user-pubkey");

    if (!userPubkey) {
      return apiError(
        {
          code: ErrorCode.UNAUTHORIZED,
          message: "Authentication required",
        },
        401
      );
    }

    const validation = await validateBody(request, createBountySchema);

    if (validation.error) {
      return validation.error;
    }

    const data = validation.data!;

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
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Workspace not found or you are not a member",
        },
        404
      );
    }

    const member = workspace.members[0];

    if (
      member.role !== WorkspaceRole.OWNER &&
      member.role !== WorkspaceRole.ADMIN &&
      member.role !== WorkspaceRole.CONTRIBUTOR
    ) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "Only workspace owners, admins, and contributors can create bounties",
        },
        403
      );
    }

    if (data.status === BountyStatus.OPEN) {
      const budget = workspace.budget;
      if (!budget || BigInt(data.amount) > budget.availableBudget) {
        return apiError(
          {
            code: ErrorCode.VALIDATION_ERROR,
            message: "Insufficient workspace budget to open this bounty",
            details: {
              required: data.amount,
              available: budget?.availableBudget.toString() || "0",
            },
          },
          400
        );
      }
    }

    const result = await db.$transaction(async (tx) => {
      const bounty = await tx.bounty.create({
        data: {
          workspaceId,
          creatorPubkey: userPubkey,
          title: data.title,
          description: data.description,
          deliverables: data.deliverables,
          amount: BigInt(data.amount),
          status: data.status,
          tags: data.tags,
          codingLanguages: data.codingLanguages,
          estimatedHours: data.estimatedHours,
          estimatedCompletionDate: data.estimatedCompletionDate,
          githubIssueUrl: data.githubIssueUrl || null,
          loomVideoUrl: data.loomVideoUrl || null,
        },
        include: {
          creator: {
            select: {
              pubkey: true,
              username: true,
            },
          },
        },
      });

      if (data.status === BountyStatus.OPEN) {
        await tx.workspaceBudget.update({
          where: { workspaceId },
          data: {
            availableBudget: {
              decrement: BigInt(data.amount),
            },
            reservedBudget: {
              increment: BigInt(data.amount),
            },
          },
        });
      }

      await tx.bountyActivity.create({
        data: {
          bountyId: bounty.id,
          userPubkey,
          action: BountyActivityAction.CREATED,
          details: {
            title: bounty.title,
            amount: data.amount,
            status: data.status,
          },
        },
      });

      return bounty;
    });

    return apiCreated({
      id: result.id,
      title: result.title,
      description: result.description,
      deliverables: result.deliverables,
      amount: result.amount.toString(),
      status: result.status,
      tags: result.tags,
      codingLanguages: result.codingLanguages,
      estimatedCompletionDate: result.estimatedCompletionDate?.toISOString() || null,
      githubIssueUrl: result.githubIssueUrl,
      createdAt: result.createdAt.toISOString(),
      creator: result.creator,
    });
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/workspaces/${workspaceId}/bounties`,
      method: "POST",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to create bounty",
      },
      500
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params;
  try {
    const userPubkey = request.headers.get("x-user-pubkey");

    if (!userPubkey) {
      return apiError(
        {
          code: ErrorCode.UNAUTHORIZED,
          message: "Authentication required",
        },
        401
      );
    }

    const { searchParams } = new URL(request.url);
    const validation = validateQuery(searchParams, listBountiesSchema);

    if (validation.error) {
      return validation.error;
    }

    const query = validation.data!;

    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId, deletedAt: null },
      include: {
        members: {
          where: { userPubkey },
        },
      },
    });

    if (!workspace || workspace.members.length === 0) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Workspace not found or you are not a member",
        },
        404
      );
    }

    const where: Prisma.BountyWhereInput = {
      workspaceId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.assigneePubkey) {
      where.assigneePubkey = query.assigneePubkey;
    }

    if (query.tags && query.tags.length > 0) {
      where.tags = {
        hasSome: query.tags,
      };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" as Prisma.QueryMode } },
        { description: { contains: query.search, mode: "insensitive" as Prisma.QueryMode } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [total, bounties] = await Promise.all([
      db.bounty.count({ where }),
      db.bounty.findMany({
        where,
        skip,
        take,
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
        include: {
          creator: {
            select: {
              pubkey: true,
              username: true,
            },
          },
          assignee: {
            select: {
              pubkey: true,
              username: true,
            },
          },
          _count: {
            select: {
              proofs: true,
            },
          },
        },
      }),
    ]);

    return apiPaginated(
      bounties.map((bounty) => ({
        id: bounty.id,
        title: bounty.title,
        description: bounty.description,
        amount: bounty.amount.toString(),
        status: bounty.status,
        tags: bounty.tags,
        codingLanguages: bounty.codingLanguages,
        estimatedCompletionDate: bounty.estimatedCompletionDate?.toISOString() || null,
        githubIssueUrl: bounty.githubIssueUrl,
        createdAt: bounty.createdAt.toISOString(),
        updatedAt: bounty.updatedAt.toISOString(),
        creator: bounty.creator,
        assignee: bounty.assignee,
        _count: bounty._count,
      })),
      {
        page: query.page,
        pageSize: query.limit,
        totalCount: total,
      }
    );
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/workspaces/${workspaceId}/bounties`,
      method: "GET",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Failed to fetch bounties",
      },
      500
    );
  }
}
