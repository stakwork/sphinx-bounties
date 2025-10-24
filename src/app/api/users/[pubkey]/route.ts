import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, validateBody } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/types/error";
import { ERROR_MESSAGES } from "@/lib/error-constants";
import { updateProfileSchema } from "@/validations/user.schema";
import type { UserProfileResponse, UpdateUserResponse } from "@/types/user";
import { BountyStatus } from "@prisma/client";

/**
 * @swagger
 * /api/users/{pubkey}:
 *   get:
 *     tags: [Users]
 *     summary: Get user profile
 *     description: Retrieve detailed user profile information
 *     parameters:
 *       - in: path
 *         name: pubkey
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile with stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pubkey:
 *                   type: string
 *                 username:
 *                   type: string
 *                 alias:
 *                   type: string
 *                   nullable: true
 *                 description:
 *                   type: string
 *                   nullable: true
 *                 avatarUrl:
 *                   type: string
 *                   nullable: true
 *                 stats:
 *                   type: object
 *       404:
 *         description: User not found
 *   patch:
 *     tags: [Users]
 *     summary: Update user profile
 *     description: Update authenticated user's profile information
 *     security:
 *       - NostrAuth: []
 *     parameters:
 *       - in: path
 *         name: pubkey
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               alias:
 *                 type: string
 *               description:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *               contactKey:
 *                 type: string
 *               routeHint:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Can only update own profile
 *       404:
 *         description: User not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pubkey: string }> }
) {
  const { pubkey } = await params;
  try {
    const user = await db.user.findUnique({
      where: {
        pubkey,
        deletedAt: null,
      },
      select: {
        pubkey: true,
        username: true,
        alias: true,
        description: true,
        avatarUrl: true,
        contactKey: true,
        routeHint: true,
        githubUsername: true,
        githubVerified: true,
        twitterUsername: true,
        twitterVerified: true,
        createdAt: true,
        lastLogin: true,
        assignedBounties: {
          where: {
            status: {
              in: [BountyStatus.PAID, BountyStatus.COMPLETED],
            },
            deletedAt: null,
          },
          select: {
            amount: true,
          },
        },
        createdBounties: {
          where: { deletedAt: null },
          select: { id: true },
        },
        memberships: {
          where: {
            workspace: { deletedAt: null },
          },
          select: {
            workspaceId: true,
          },
        },
      },
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

    const [bountiesCompletedCount, activeBountiesCount] = await Promise.all([
      db.bounty.count({
        where: {
          assigneePubkey: pubkey,
          status: {
            in: [BountyStatus.PAID, BountyStatus.COMPLETED],
          },
          deletedAt: null,
        },
      }),
      db.bounty.count({
        where: {
          assigneePubkey: pubkey,
          status: {
            in: [BountyStatus.ASSIGNED, BountyStatus.IN_REVIEW],
          },
          deletedAt: null,
        },
      }),
    ]);

    const totalEarned = user.assignedBounties.reduce((sum, bounty) => sum + bounty.amount, 0);

    const response: UserProfileResponse = {
      user: {
        pubkey: user.pubkey,
        username: user.username,
        alias: user.alias,
        description: user.description,
        avatarUrl: user.avatarUrl,
        contactKey: user.contactKey,
        routeHint: user.routeHint,
        githubUsername: user.githubVerified ? user.githubUsername : null,
        githubVerified: user.githubVerified,
        twitterUsername: user.twitterVerified ? user.twitterUsername : null,
        twitterVerified: user.twitterVerified,
        createdAt: user.createdAt.toISOString(),
        lastLogin: user.lastLogin?.toISOString() || null,
        stats: {
          totalEarned: totalEarned.toString(),
          bountiesCompleted: bountiesCompletedCount,
          bountiesCreated: user.createdBounties.length,
          activeBounties: activeBountiesCount,
          workspacesCount: user.memberships.length,
        },
      },
    };

    return apiSuccess(response);
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/users/${pubkey}`,
      method: "GET",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      },
      500
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pubkey: string }> }
) {
  const { pubkey } = await params;
  try {
    const userPubkey = request.headers.get("x-user-pubkey");

    if (!userPubkey) {
      return apiError(
        {
          code: ErrorCode.UNAUTHORIZED,
          message: ERROR_MESSAGES.UNAUTHORIZED,
        },
        401
      );
    }

    if (userPubkey !== pubkey) {
      return apiError(
        {
          code: ErrorCode.FORBIDDEN,
          message: "You can only update your own profile",
        },
        403
      );
    }

    const validation = await validateBody(request, updateProfileSchema);
    if (validation.error) return validation.error;

    const updateData = validation.data!;

    const user = await db.user.findUnique({
      where: {
        pubkey,
        deletedAt: null,
      },
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

    if (updateData.username && updateData.username !== user.username) {
      const existingUser = await db.user.findUnique({
        where: { username: updateData.username },
      });

      if (existingUser) {
        return apiError(
          {
            code: ErrorCode.CONFLICT,
            message: "Username is already taken",
          },
          409
        );
      }
    }

    const updatedUser = await db.user.update({
      where: { pubkey },
      data: {
        ...(updateData.username && { username: updateData.username }),
        alias: updateData.alias === "" ? null : updateData.alias,
        description: updateData.description === "" ? null : updateData.description,
        avatarUrl: updateData.avatarUrl === "" ? null : updateData.avatarUrl,
        contactKey: updateData.contactKey === "" ? null : updateData.contactKey,
        routeHint: updateData.routeHint === "" ? null : updateData.routeHint,
        githubUsername: updateData.githubUsername === "" ? null : updateData.githubUsername,
        twitterUsername: updateData.twitterUsername === "" ? null : updateData.twitterUsername,
      },
      select: {
        pubkey: true,
        username: true,
        alias: true,
        description: true,
        avatarUrl: true,
        contactKey: true,
        routeHint: true,
        githubUsername: true,
        twitterUsername: true,
      },
    });

    const response: UpdateUserResponse = {
      message: "Profile updated successfully",
      user: updatedUser,
    };

    return apiSuccess(response);
  } catch (error) {
    logApiError(error as Error, {
      url: `/api/users/${pubkey}`,
      method: "PATCH",
    });
    return apiError(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      },
      500
    );
  }
}
