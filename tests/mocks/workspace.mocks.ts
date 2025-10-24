/**
 * Mock data and factories for workspace-related tests
 */

import type { Workspace, WorkspaceBudget, WorkspaceMember } from "@prisma/client";
import { WorkspaceRole } from "@prisma/client";

/**
 * Create mock workspace data
 */
export const createMockWorkspace = (overrides?: Partial<Workspace>): Workspace => {
  const timestamp = Date.now();
  return {
    id: `workspace-${timestamp}`,
    name: `Test Workspace ${timestamp}`,
    description: "Test workspace description",
    mission: "Test mission statement",
    ownerPubkey: "02" + "1".repeat(64),
    avatarUrl: null,
    websiteUrl: null,
    githubUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
};

/**
 * Create mock workspace budget
 */
export const createMockWorkspaceBudget = (
  overrides?: Partial<WorkspaceBudget>
): WorkspaceBudget => {
  return {
    id: `budget-${Date.now()}`,
    workspaceId: `workspace-${Date.now()}`,
    totalBudget: 0,
    availableBudget: 0,
    reservedBudget: 0,
    paidBudget: 0,
    updatedAt: new Date(),
    ...overrides,
  };
};

/**
 * Create mock workspace member
 */
export const createMockWorkspaceMember = (
  overrides?: Partial<WorkspaceMember>
): WorkspaceMember => {
  return {
    id: `member-${Date.now()}`,
    workspaceId: `workspace-${Date.now()}`,
    userPubkey: "02" + "1".repeat(64),
    role: WorkspaceRole.CONTRIBUTOR,
    joinedAt: new Date(),
    ...overrides,
  };
};

/**
 * Valid workspace creation payload
 */
export const validWorkspacePayload = {
  name: "valid-workspace-name",
  description: "This is a valid workspace description for testing",
  mission: "This is a valid mission statement for the workspace",
};

/**
 * Invalid workspace payloads for validation testing
 */
export const invalidWorkspacePayloads = {
  nameTooShort: {
    name: "ab",
    description: "Valid description here",
    mission: "Valid mission statement here",
  },
  nameTooLong: {
    name: "a".repeat(51),
    description: "Valid description here",
    mission: "Valid mission statement here",
  },
  nameInvalidChars: {
    name: "invalid name!@#",
    description: "Valid description here",
    mission: "Valid mission statement here",
  },
  descriptionTooShort: {
    name: "valid-name",
    description: "short",
    mission: "Valid mission statement here",
  },
  descriptionTooLong: {
    name: "valid-name",
    description: "a".repeat(121),
    mission: "Valid mission statement here",
  },
  missionTooShort: {
    name: "valid-name",
    description: "Valid description here",
    mission: "short",
  },
  missionTooLong: {
    name: "valid-name",
    description: "Valid description here",
    mission: "a".repeat(501),
  },
};
