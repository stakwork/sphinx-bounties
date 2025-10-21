/**
 * Database utilities for integration tests
 */

import { db } from "@/lib/db";
import { WorkspaceRole } from "@prisma/client";

/**
 * Generate a unique test pubkey
 */
export const generateTestPubkey = (prefix = "test"): string => {
  return `02${prefix}${Date.now()}${"0".repeat(40)}`.slice(0, 66);
};

/**
 * Create a test user in the database
 */
export const createTestUser = async (options?: {
  pubkey?: string;
  username?: string;
  alias?: string;
}) => {
  const pubkey = options?.pubkey || generateTestPubkey();
  const timestamp = Date.now().toString().slice(-8);

  const user = await db.user.upsert({
    where: { pubkey },
    create: {
      pubkey,
      username: options?.username || `user${timestamp}`,
      alias: options?.alias || "Test User",
    },
    update: {},
  });

  return user;
};

/**
 * Create a test workspace with budget, owner member, and activity
 */
export const createTestWorkspace = async (options: {
  ownerPubkey: string;
  name?: string;
  description?: string;
  mission?: string;
}) => {
  const timestamp = Date.now();
  const name = options.name || `test-workspace-${timestamp}`;

  const workspace = await db.workspace.create({
    data: {
      name,
      description: options.description || "Test workspace description",
      mission: options.mission || "Test mission statement for workspace",
      ownerPubkey: options.ownerPubkey,
    },
  });

  const budget = await db.workspaceBudget.create({
    data: { workspaceId: workspace.id },
  });

  const member = await db.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userPubkey: options.ownerPubkey,
      role: WorkspaceRole.OWNER,
    },
  });

  return { workspace, budget, member };
};

/**
 * Add a member to a workspace
 */
export const addWorkspaceMember = async (options: {
  workspaceId: string;
  userPubkey: string;
  role?: WorkspaceRole;
}) => {
  return db.workspaceMember.create({
    data: {
      workspaceId: options.workspaceId,
      userPubkey: options.userPubkey,
      role: options.role || WorkspaceRole.CONTRIBUTOR,
    },
  });
};

/**
 * Clean up test data for a user (removes all associated data)
 */
export const cleanupTestUser = async (pubkey: string) => {
  await db.workspaceMember.deleteMany({
    where: { userPubkey: pubkey },
  });

  await db.workspaceBudget.deleteMany({
    where: {
      workspace: { ownerPubkey: pubkey },
    },
  });

  await db.workspaceActivity.deleteMany({
    where: { userPubkey: pubkey },
  });

  await db.workspace.deleteMany({
    where: { ownerPubkey: pubkey },
  });

  await db.user.deleteMany({
    where: { pubkey },
  });
};

/**
 * Clean up test data for multiple users
 */
export const cleanupTestUsers = async (pubkeys: string[]) => {
  await Promise.all(pubkeys.map((pubkey) => cleanupTestUser(pubkey)));
};

/**
 * Connect to database (use in beforeAll)
 */
export const connectTestDb = async () => {
  await db.$connect();
};

/**
 * Disconnect from database (use in afterAll)
 */
export const disconnectTestDb = async () => {
  await db.$disconnect();
};
