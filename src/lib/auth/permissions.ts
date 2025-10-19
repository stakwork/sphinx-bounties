import { db } from "@/lib/db";
import { WorkspaceRole } from "@prisma/client";

const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  CONTRIBUTOR: 2,
  VIEWER: 1,
};

export async function getUserWorkspaceRole(
  userPubkey: string,
  workspaceId: string
): Promise<WorkspaceRole | null> {
  const membership = await db.workspaceMember.findFirst({
    where: {
      workspaceId,
      user: { pubkey: userPubkey },
    },
    select: { role: true },
  });

  return membership?.role ?? null;
}

export async function hasWorkspaceRole(
  userPubkey: string,
  workspaceId: string,
  requiredRole: WorkspaceRole
): Promise<boolean> {
  const userRole = await getUserWorkspaceRole(userPubkey, workspaceId);
  if (!userRole) return false;

  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isSuperAdmin(pubkey: string): boolean {
  const admins = process.env.SUPER_ADMINS?.split(",") ?? [];
  return admins.includes(pubkey);
}

export async function canManageWorkspace(
  userPubkey: string,
  workspaceId: string
): Promise<boolean> {
  return hasWorkspaceRole(userPubkey, workspaceId, WorkspaceRole.ADMIN);
}

export async function canManageBounty(userPubkey: string, bountyId: string): Promise<boolean> {
  const bounty = await db.bounty.findUnique({
    where: { id: bountyId },
    select: {
      creatorPubkey: true,
      workspace: {
        select: { id: true },
      },
    },
  });

  if (!bounty) return false;
  if (bounty.creatorPubkey === userPubkey) return true;

  return hasWorkspaceRole(userPubkey, bounty.workspace.id, WorkspaceRole.ADMIN);
}
