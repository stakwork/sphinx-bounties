import { BountyStatus, WorkspaceRole, ProofStatus } from "@/types/enums";
import { colors } from "@/config/colors";

export const BOUNTY_STATUS_CONFIG = {
  [BountyStatus.DRAFT]: {
    label: "Draft",
    color: colors.neutral[500],
    bgColor: colors.neutral[100],
    description: "Not yet published",
    canClaim: false,
    canEdit: true,
    canDelete: true,
  },
  [BountyStatus.OPEN]: {
    label: "Open",
    color: colors.secondary[700],
    bgColor: colors.secondary[50],
    description: "Available for claiming",
    canClaim: true,
    canEdit: true,
    canDelete: true,
  },
  [BountyStatus.ASSIGNED]: {
    label: "Assigned",
    color: colors.primary[700],
    bgColor: colors.primary[50],
    description: "Claimed by a user",
    canClaim: false,
    canEdit: false,
    canDelete: false,
  },
  [BountyStatus.IN_REVIEW]: {
    label: "In Review",
    color: colors.tertiary[700],
    bgColor: colors.tertiary[50],
    description: "Awaiting verification",
    canClaim: false,
    canEdit: false,
    canDelete: false,
  },
  [BountyStatus.COMPLETED]: {
    label: "Completed",
    color: colors.secondary[800],
    bgColor: colors.secondary[100],
    description: "Verified and approved",
    canClaim: false,
    canEdit: false,
    canDelete: false,
  },
  [BountyStatus.PAID]: {
    label: "Paid",
    color: colors.tertiary[800],
    bgColor: colors.tertiary[100],
    description: "Payment completed",
    canClaim: false,
    canEdit: false,
    canDelete: false,
  },
  [BountyStatus.CANCELLED]: {
    label: "Cancelled",
    color: colors.neutral[600],
    bgColor: colors.neutral[100],
    description: "No longer active",
    canClaim: false,
    canEdit: false,
    canDelete: false,
  },
} as const;

export const WORKSPACE_ROLE_CONFIG = {
  [WorkspaceRole.OWNER]: {
    label: "Owner",
    color: colors.accent[600],
    bgColor: colors.accent[100],
    description: "Full workspace control",
    level: 4,
  },
  [WorkspaceRole.ADMIN]: {
    label: "Admin",
    color: colors.tertiary[600],
    bgColor: colors.tertiary[100],
    description: "Administrative access",
    level: 3,
  },
  [WorkspaceRole.CONTRIBUTOR]: {
    label: "Contributor",
    color: colors.primary[600],
    bgColor: colors.primary[100],
    description: "Can create and work on bounties",
    level: 2,
  },
  [WorkspaceRole.VIEWER]: {
    label: "Viewer",
    color: colors.neutral[600],
    bgColor: colors.neutral[100],
    description: "Read-only access",
    level: 1,
  },
} as const;

export const PROOF_STATUS_CONFIG = {
  [ProofStatus.PENDING]: {
    label: "Pending",
    color: colors.tertiary[500],
    bgColor: colors.tertiary[100],
    description: "Awaiting review",
  },
  [ProofStatus.ACCEPTED]: {
    label: "Accepted",
    color: colors.secondary[600],
    bgColor: colors.secondary[100],
    description: "Proof approved",
  },
  [ProofStatus.REJECTED]: {
    label: "Rejected",
    color: colors.accent[600],
    bgColor: colors.accent[100],
    description: "Proof declined",
  },
  [ProofStatus.CHANGES_REQUESTED]: {
    label: "Changes Requested",
    color: colors.primary[500],
    bgColor: colors.primary[100],
    description: "Needs modifications",
  },
} as const;

export const WORKSPACE_ROLE_HIERARCHY: readonly WorkspaceRole[] = [
  WorkspaceRole.OWNER,
  WorkspaceRole.ADMIN,
  WorkspaceRole.CONTRIBUTOR,
  WorkspaceRole.VIEWER,
] as const;

export function hasHigherRole(userRole: WorkspaceRole, requiredRole: WorkspaceRole): boolean {
  const userLevel = WORKSPACE_ROLE_CONFIG[userRole].level;
  const requiredLevel = WORKSPACE_ROLE_CONFIG[requiredRole].level;
  return userLevel >= requiredLevel;
}

export function canManageBounty(
  bountyStatus: BountyStatus,
  action: "claim" | "edit" | "delete"
): boolean {
  const config = BOUNTY_STATUS_CONFIG[bountyStatus];
  switch (action) {
    case "claim":
      return config.canClaim;
    case "edit":
      return config.canEdit;
    case "delete":
      return config.canDelete;
    default:
      return false;
  }
}

export function getBountyStatusColor(status: BountyStatus): string {
  return BOUNTY_STATUS_CONFIG[status].color;
}

export function getBountyStatusLabel(status: BountyStatus): string {
  return BOUNTY_STATUS_CONFIG[status].label;
}

export function getWorkspaceRoleColor(role: WorkspaceRole): string {
  return WORKSPACE_ROLE_CONFIG[role].color;
}

export function getWorkspaceRoleLabel(role: WorkspaceRole): string {
  return WORKSPACE_ROLE_CONFIG[role].label;
}

export function getProofStatusColor(status: ProofStatus): string {
  return PROOF_STATUS_CONFIG[status].color;
}

export function getProofStatusLabel(status: ProofStatus): string {
  return PROOF_STATUS_CONFIG[status].label;
}
