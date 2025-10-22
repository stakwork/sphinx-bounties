import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createCommentSchema } from "@/validations/bounty.schema";
import { ErrorCode } from "@/types/error";
import { apiError, apiCreated, apiPaginated, validateQuery, validateBody } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * @swagger
 * /api/bounties/{id}/comments:
 *   get:
 *     tags: [Comments]
 *     summary: List bounty comments
 *     description: Get paginated list of comments for a bounty
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
 *     responses:
 *       200:
 *         description: Paginated list of comments
 *       404:
 *         description: Bounty not found
 *   post:
 *     tags: [Comments]
 *     summary: Create comment
 *     description: Add a comment to a bounty
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Bounty not found
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bountyId } = await params;
  try {
    const { searchParams } = new URL(request.url);
    const validation = validateQuery(searchParams, querySchema);

    if (validation.error) {
      return validation.error;
    }

    const { page, limit } = validation.data!;
    const skip = (page - 1) * limit;

    const [comments, totalCount] = await Promise.all([
      db.bountyComment.findMany({
        where: {
          bountyId,
          deletedAt: null,
        },
        include: {
          author: {
            select: {
              pubkey: true,
              username: true,
              alias: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      db.bountyComment.count({
        where: {
          bountyId,
          deletedAt: null,
        },
      }),
    ]);

    return apiPaginated(comments, {
      page,
      pageSize: limit,
      totalCount,
    });
  } catch (error) {
    logApiError(error as Error, {
      url: request.url,
      method: request.method,
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "An unexpected error occurred",
      },
      500
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bountyId } = await params;
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

    const validation = await validateBody(request, createCommentSchema.omit({ bountyId: true }));

    if (validation.error) {
      return validation.error;
    }

    const { content } = validation.data!;

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
      },
    });

    if (!bounty) {
      return apiError(
        {
          code: ErrorCode.NOT_FOUND,
          message: "Bounty not found",
        },
        404
      );
    }

    if (bounty.workspace.members.length === 0) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "You must be a workspace member to comment",
        },
        403
      );
    }

    const comment = await db.bountyComment.create({
      data: {
        bountyId,
        authorPubkey: userPubkey,
        content,
      },
      include: {
        author: {
          select: {
            pubkey: true,
            username: true,
            alias: true,
            avatarUrl: true,
          },
        },
      },
    });

    return apiCreated(comment);
  } catch (error) {
    logApiError(error as Error, {
      url: request.url,
      method: request.method,
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "An unexpected error occurred",
      },
      500
    );
  }
}
