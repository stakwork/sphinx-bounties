import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  BountyStatus,
  BountyActivityAction,
  WorkspaceRole,
  type ProgrammingLanguage,
} from "@prisma/client";
import type { ApiResponse } from "@/types/api";
import { createBountySchema } from "@/validations/bounty.schema";
import type { Prisma } from "@prisma/client";

/**
 * Schema for listing bounties with filters
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

type ListBountiesQuery = z.infer<typeof listBountiesSchema>;

interface BountyListItem {
  id: string;
  title: string;
  description: string;
  amount: string;
  status: BountyStatus;
  tags: string[];
  codingLanguages: ProgrammingLanguage[];
  estimatedCompletionDate: string | null;
  githubIssueUrl: string | null;
  createdAt: string;
  updatedAt: string;
  creator: {
    pubkey: string;
    username: string;
  };
  assignee: {
    pubkey: string;
    username: string;
  } | null;
  _count: {
    proofs: number;
  };
}

interface CreateBountyResponse {
  id: string;
  title: string;
  description: string;
  deliverables: string;
  amount: string;
  status: BountyStatus;
  tags: string[];
  codingLanguages: ProgrammingLanguage[];
  estimatedCompletionDate: string | null;
  githubIssueUrl: string | null;
  createdAt: string;
  creator: {
    pubkey: string;
    username: string;
  };
}

interface ListBountiesResponse {
  bounties: BountyListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * POST /api/workspaces/[id]/bounties
 * Create a new bounty in the workspace
 * @permission OWNER, ADMIN, CONTRIBUTOR
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<CreateBountyResponse>>> {
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
    const validation = createBountySchema.safeParse(body);

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

    const data = validation.data;

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

    // Permission check: OWNER, ADMIN, or CONTRIBUTOR can create bounties
    if (
      member.role !== WorkspaceRole.OWNER &&
      member.role !== WorkspaceRole.ADMIN &&
      member.role !== WorkspaceRole.CONTRIBUTOR
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only workspace owners, admins, and contributors can create bounties",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    // Check budget availability if status is OPEN
    if (data.status === BountyStatus.OPEN) {
      const budget = workspace.budget;
      if (!budget || BigInt(data.amount) > budget.availableBudget) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INSUFFICIENT_FUNDS",
              message: "Insufficient workspace budget to open this bounty",
              details: {
                required: data.amount,
                available: budget?.availableBudget.toString() || "0",
              },
            },
            meta: { timestamp: new Date().toISOString() },
          },
          { status: 422 }
        );
      }
    }

    // Create bounty with transaction to reserve budget if OPEN
    const result = await db.$transaction(async (tx) => {
      // Create the bounty
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

      // If status is OPEN, reserve budget
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

      // Log bounty activity
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

    return NextResponse.json(
      {
        success: true,
        data: {
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
        },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Bounty creation error:", error);
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

/**
 * GET /api/workspaces/[id]/bounties
 * List bounties in the workspace with filtering and pagination
 * @permission All workspace members
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ListBountiesResponse>>> {
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

    // Parse query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validation = listBountiesSchema.safeParse(searchParams);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
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

    const query: ListBountiesQuery = validation.data;

    // Check workspace existence and user membership
    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId, deletedAt: null },
      include: {
        members: {
          where: { userPubkey },
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

    // Build where clause for filtering
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

    // Calculate pagination
    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    // Get total count and bounties in parallel
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

    const totalPages = Math.ceil(total / query.limit);

    return NextResponse.json(
      {
        success: true,
        data: {
          bounties: bounties.map((bounty) => ({
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
          pagination: {
            total,
            page: query.page,
            limit: query.limit,
            totalPages,
          },
        },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Bounty listing error:", error);
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
