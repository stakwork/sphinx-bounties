import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import type { ApiResponse } from "@/types/api";
import type { BountyDetailsResponse, UpdateBountyResponse } from "@/types/bounty";
import { updateBountySchema } from "@/validations/bounty.schema";
import { BountyStatus, BountyActivityAction } from "@prisma/client";

/**
 * GET /api/workspaces/[id]/bounties/[bountyId]
 * Get detailed information about a specific bounty
 * @permission All workspace members
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bountyId: string }> }
): Promise<NextResponse<ApiResponse<BountyDetailsResponse>>> {
  try {
    const { id: workspaceId, bountyId } = await params;
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

    // Fetch bounty with all related data
    const bounty = await db.bounty.findUnique({
      where: {
        id: bountyId,
        workspaceId,
      },
      include: {
        creator: {
          select: {
            pubkey: true,
            username: true,
            alias: true,
            avatarUrl: true,
          },
        },
        assignee: {
          select: {
            pubkey: true,
            username: true,
            alias: true,
            avatarUrl: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        proofs: {
          select: {
            id: true,
            description: true,
            proofUrl: true,
            status: true,
            createdAt: true,
            submitter: {
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
        },
        activities: {
          select: {
            id: true,
            action: true,
            timestamp: true,
            user: {
              select: {
                pubkey: true,
                username: true,
                alias: true,
              },
            },
          },
          orderBy: {
            timestamp: "desc",
          },
          take: 50, // Limit activities to last 50
        },
        _count: {
          select: {
            proofs: true,
            activities: true,
          },
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

    return NextResponse.json(
      {
        success: true,
        data: {
          id: bounty.id,
          title: bounty.title,
          description: bounty.description,
          deliverables: bounty.deliverables,
          amount: bounty.amount.toString(),
          status: bounty.status,
          tags: bounty.tags,
          codingLanguages: bounty.codingLanguages,
          estimatedHours: bounty.estimatedHours,
          estimatedCompletionDate: bounty.estimatedCompletionDate?.toISOString() || null,
          githubIssueUrl: bounty.githubIssueUrl,
          loomVideoUrl: bounty.loomVideoUrl,
          createdAt: bounty.createdAt.toISOString(),
          updatedAt: bounty.updatedAt.toISOString(),
          assignedAt: bounty.assignedAt?.toISOString() || null,
          completedAt: bounty.completedAt?.toISOString() || null,
          paidAt: bounty.paidAt?.toISOString() || null,
          creator: bounty.creator,
          assignee: bounty.assignee,
          workspace: bounty.workspace,
          proofs: bounty.proofs.map((proof) => ({
            ...proof,
            createdAt: proof.createdAt.toISOString(),
          })),
          activities: bounty.activities.map((activity) => ({
            ...activity,
            timestamp: activity.timestamp.toISOString(),
          })),
          _count: bounty._count,
        },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Bounty details error:", error);
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
 * PATCH /api/workspaces/[id]/bounties/[bountyId]
 * Update bounty details
 * @permission Requires OWNER/ADMIN role or creator permission. Amount changes require OWNER/ADMIN.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bountyId: string }> }
): Promise<NextResponse<ApiResponse<UpdateBountyResponse>>> {
  try {
    const { id: workspaceId, bountyId } = await params;
    const user = await request.headers.get("x-user-pubkey");

    if (!user) {
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

    // Verify workspace membership and get role
    const member = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userPubkey: {
          workspaceId,
          userPubkey: user,
        },
      },
      select: {
        role: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Access denied to this workspace",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateBountySchema.parse(body);

    // Get existing bounty
    const existingBounty = await db.bounty.findUnique({
      where: {
        id: bountyId,
        workspaceId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        deliverables: true,
        amount: true,
        status: true,
        tags: true,
        codingLanguages: true,
        estimatedHours: true,
        estimatedCompletionDate: true,
        githubIssueUrl: true,
        loomVideoUrl: true,
        creatorPubkey: true,
      },
    });

    if (!existingBounty) {
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

    // Check if bounty can be updated
    if (
      existingBounty.status === BountyStatus.COMPLETED ||
      existingBounty.status === BountyStatus.PAID
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BOUNTY_COMPLETED",
            message: "Cannot update completed or paid bounty",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    // Check permissions: OWNER/ADMIN can update anything, creator can update unless changing amount
    const isOwnerOrAdmin = ["OWNER", "ADMIN"].includes(member.role);
    const isCreator = existingBounty.creatorPubkey === user;

    if (!isOwnerOrAdmin && !isCreator) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You don't have permission to update this bounty",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    // If amount is being changed, only OWNER/ADMIN can do it
    if (validatedData.amount !== undefined && !isOwnerOrAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only workspace owners and admins can change bounty amount",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    // Handle budget adjustments if amount is changing
    let budgetAdjustment: bigint | null = null;
    if (validatedData.amount !== undefined) {
      const oldAmount = existingBounty.amount;
      const newAmount = BigInt(validatedData.amount);
      budgetAdjustment = newAmount - oldAmount;

      if (budgetAdjustment !== BigInt(0)) {
        const workspaceBudget = await db.workspaceBudget.findUnique({
          where: { workspaceId },
        });

        if (!workspaceBudget) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "BUDGET_NOT_FOUND",
                message: "Workspace budget not found",
              },
              meta: { timestamp: new Date().toISOString() },
            },
            { status: 404 }
          );
        }

        // If increasing amount, check available budget
        if (budgetAdjustment > BigInt(0)) {
          if (workspaceBudget.availableBudget < budgetAdjustment) {
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: "INSUFFICIENT_BUDGET",
                  message: "Insufficient workspace budget for amount increase",
                },
                meta: { timestamp: new Date().toISOString() },
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // Update bounty and adjust budget in a transaction
    const updatedBounty = await db.$transaction(async (tx) => {
      // Update the bounty
      const bounty = await tx.bounty.update({
        where: { id: bountyId },
        data: {
          title: validatedData.title,
          description: validatedData.description,
          deliverables: validatedData.deliverables,
          amount: validatedData.amount !== undefined ? BigInt(validatedData.amount) : undefined,
          tags: validatedData.tags,
          codingLanguages: validatedData.codingLanguages,
          estimatedHours: validatedData.estimatedHours,
          estimatedCompletionDate: validatedData.estimatedCompletionDate,
          githubIssueUrl: validatedData.githubIssueUrl,
          loomVideoUrl: validatedData.loomVideoUrl,
        },
        select: {
          id: true,
          title: true,
          description: true,
          deliverables: true,
          amount: true,
          status: true,
          tags: true,
          codingLanguages: true,
          estimatedHours: true,
          estimatedCompletionDate: true,
          githubIssueUrl: true,
          loomVideoUrl: true,
          updatedAt: true,
        },
      });

      // Adjust workspace budget if amount changed
      if (budgetAdjustment !== null && budgetAdjustment !== BigInt(0)) {
        if (budgetAdjustment > BigInt(0)) {
          // Increasing amount: decrease available, increase reserved
          await tx.workspaceBudget.update({
            where: { workspaceId },
            data: {
              availableBudget: {
                decrement: budgetAdjustment,
              },
              reservedBudget: {
                increment: budgetAdjustment,
              },
            },
          });
        } else {
          // Decreasing amount: increase available, decrease reserved
          await tx.workspaceBudget.update({
            where: { workspaceId },
            data: {
              availableBudget: {
                increment: -budgetAdjustment,
              },
              reservedBudget: {
                decrement: -budgetAdjustment,
              },
            },
          });
        }
      }

      // Log the update activity
      await tx.bountyActivity.create({
        data: {
          bountyId: bounty.id,
          action: BountyActivityAction.UPDATED,
          userPubkey: user,
          details: {
            changes: validatedData,
            budgetAdjustment: budgetAdjustment?.toString() ?? null,
          },
        },
      });

      return bounty;
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Bounty updated successfully",
          bounty: {
            id: updatedBounty.id,
            title: updatedBounty.title,
            description: updatedBounty.description,
            deliverables: updatedBounty.deliverables,
            amount: updatedBounty.amount.toString(),
            status: updatedBounty.status,
            tags: updatedBounty.tags,
            codingLanguages: updatedBounty.codingLanguages,
            estimatedHours: updatedBounty.estimatedHours,
            estimatedCompletionDate: updatedBounty.estimatedCompletionDate?.toISOString() ?? null,
            githubIssueUrl: updatedBounty.githubIssueUrl,
            loomVideoUrl: updatedBounty.loomVideoUrl,
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating bounty:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update bounty",
        },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 500 }
    );
  }
}
