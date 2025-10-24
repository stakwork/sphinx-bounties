import type { Workspace, WorkspaceBudget, WorkspaceMember } from "@prisma/client";
import { WorkspaceRole } from "@prisma/client";
import { generateTestPubkey } from "../utils";

export const mockWorkspace = (overrides?: Partial<Workspace>): Workspace => {
  const timestamp = Date.now();

  return {
    id: overrides?.id || `workspace_${timestamp}`,
    name: overrides?.name || `test-workspace-${timestamp}`,
    description: overrides?.description || "Mock workspace description",
    ownerPubkey: overrides?.ownerPubkey || generateTestPubkey(),
    mission: overrides?.mission || null,
    avatarUrl: overrides?.avatarUrl || null,
    websiteUrl: overrides?.websiteUrl || null,
    githubUrl: overrides?.githubUrl || null,
    createdAt: overrides?.createdAt || new Date(),
    updatedAt: overrides?.updatedAt || new Date(),
    deletedAt: overrides?.deletedAt || null,
  };
};

export const mockWorkspaceBudget = (overrides?: Partial<WorkspaceBudget>): WorkspaceBudget => {
  const timestamp = Date.now();

  return {
    id: overrides?.id || `budget_${timestamp}`,
    workspaceId: overrides?.workspaceId || `workspace_${timestamp}`,
    totalBudget: overrides?.totalBudget || 0,
    availableBudget: overrides?.availableBudget || 0,
    reservedBudget: overrides?.reservedBudget || 0,
    paidBudget: overrides?.paidBudget || 0,
    updatedAt: overrides?.updatedAt || new Date(),
  };
};

export const mockWorkspaceMember = (overrides?: Partial<WorkspaceMember>): WorkspaceMember => {
  const timestamp = Date.now();

  return {
    id: overrides?.id || `member_${timestamp}`,
    workspaceId: overrides?.workspaceId || `workspace_${timestamp}`,
    userPubkey: overrides?.userPubkey || generateTestPubkey(),
    role: overrides?.role || WorkspaceRole.CONTRIBUTOR,
    joinedAt: overrides?.joinedAt || new Date(),
  };
};

export const mockWorkspaceWithRelations = (overrides?: {
  workspace?: Partial<Workspace>;
  budget?: Partial<WorkspaceBudget>;
  memberCount?: number;
  bountyCount?: number;
  role?: WorkspaceRole;
}) => {
  const workspace = mockWorkspace(overrides?.workspace);
  const budget = mockWorkspaceBudget({
    workspaceId: workspace.id,
    ...overrides?.budget,
  });

  return {
    ...workspace,
    budget: {
      ...budget,
      totalBudget: budget.totalBudget.toString(),
      availableBudget: budget.availableBudget.toString(),
      reservedBudget: budget.reservedBudget.toString(),
      paidBudget: budget.paidBudget.toString(),
    },
    memberCount: overrides?.memberCount || 1,
    bountyCount: overrides?.bountyCount || 0,
    role: overrides?.role || WorkspaceRole.OWNER,
    joinedAt: new Date(),
  };
};
