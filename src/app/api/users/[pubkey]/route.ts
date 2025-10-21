import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { updateProfileSchema } from "@/validations/user.schema";
import { ERROR_MESSAGES } from "@/lib/error-constants";
import type { UserProfileResponse, UpdateUserResponse } from "@/types/user";
import { BountyStatus } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pubkey: string }> }
) {
  try {
    const { pubkey } = await params;

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

    const totalEarned = user.assignedBounties.reduce(
      (sum, bounty) => sum + BigInt(bounty.amount),
      BigInt(0)
    );

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

    return NextResponse.json(
      {
        success: true,
        data: response,
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user profile:", error);
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pubkey: string }> }
) {
  try {
    const { pubkey } = await params;
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

    if (userPubkey !== pubkey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You can only update your own profile",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = updateProfileSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid profile data",
            details: validationResult.error.issues,
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: {
        pubkey,
        deletedAt: null,
      },
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

    const updateData = validationResult.data;

    if (updateData.username && updateData.username !== user.username) {
      const existingUser = await db.user.findUnique({
        where: { username: updateData.username },
      });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "USERNAME_TAKEN",
              message: "Username is already taken",
            },
            meta: { timestamp: new Date().toISOString() },
          },
          { status: 400 }
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

    return NextResponse.json(
      {
        success: true,
        data: response,
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user profile:", error);
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
