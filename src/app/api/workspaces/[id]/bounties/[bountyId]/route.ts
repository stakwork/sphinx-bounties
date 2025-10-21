import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import type { ApiResponse } from "@/types/api";
import type { BountyStatus, ProgrammingLanguage, BountyActivityAction } from "@prisma/client";

interface BountyDetailsResponse {
  id: string;
  title: string;
  description: string;
  deliverables: string;
  amount: string;
  status: BountyStatus;
  tags: string[];
  codingLanguages: ProgrammingLanguage[];
  estimatedHours: number | null;
  estimatedCompletionDate: string | null;
  githubIssueUrl: string | null;
  loomVideoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  assignedAt: string | null;
  completedAt: string | null;
  paidAt: string | null;
  creator: {
    pubkey: string;
    username: string;
    alias: string | null;
    avatarUrl: string | null;
  };
  assignee: {
    pubkey: string;
    username: string;
    alias: string | null;
    avatarUrl: string | null;
  } | null;
  workspace: {
    id: string;
    name: string;
  };
  proofs: Array<{
    id: string;
    description: string;
    proofUrl: string;
    status: string;
    createdAt: string;
    submitter: {
      pubkey: string;
      username: string;
    };
  }>;
  activities: Array<{
    id: string;
    action: BountyActivityAction;
    timestamp: string;
    user: {
      pubkey: string;
      username: string;
    };
  }>;
  _count: {
    proofs: number;
    activities: number;
  };
}

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
