/**
 * Database utilities for integration tests
 */

import { db } from "@/lib/db";
import { WorkspaceRole, BountyStatus, type ProgrammingLanguage } from "@prisma/client";

/**
 * Generate a unique test pubkey
 */
export const generateTestPubkey = (prefix = "test"): string => {
  const base = `02${prefix}${Date.now()}`;
  return base + "0".repeat(66 - base.length);
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
  // Use characters 2-16 which contain the prefix and timestamp (most unique part)
  // Skip the "02" prefix and use the next 14 chars before the zero padding
  const uniqueId = pubkey.slice(2, 16);

  const user = await db.user.upsert({
    where: { pubkey },
    create: {
      pubkey,
      username: options?.username || `user${uniqueId}`,
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
 * Create a test bounty
 */
export const createTestBounty = async (options: {
  workspaceId: string;
  creatorPubkey: string;
  title?: string;
  description?: string;
  deliverables?: string;
  amount?: number;
  status?: BountyStatus;
  tags?: string[];
  codingLanguages?: ProgrammingLanguage[];
  assigneePubkey?: string;
}) => {
  const timestamp = Date.now();
  return db.bounty.create({
    data: {
      workspaceId: options.workspaceId,
      creatorPubkey: options.creatorPubkey,
      title: options.title || `Test Bounty ${timestamp}`,
      description:
        options.description || "Test bounty description that is long enough to pass validation",
      deliverables: options.deliverables || "Test deliverables description for bounty completion",
      amount: options.amount || 5000,
      status: options.status || BountyStatus.DRAFT,
      tags: options.tags || [],
      codingLanguages: options.codingLanguages || [],
      assigneePubkey: options.assigneePubkey,
    },
  });
};

/**
 * Clean up test data for a single user
 */
export const cleanupTestUser = async (pubkey: string) => {
  // Delete bounty-related data first (foreign key constraints)
  // Delete activity for bounties where user is involved
  await db.bountyActivity.deleteMany({
    where: {
      OR: [
        {
          bounty: {
            workspace: { ownerPubkey: pubkey },
          },
        },
        {
          bounty: {
            assigneePubkey: pubkey,
          },
        },
        { userPubkey: pubkey },
      ],
    },
  });

  await db.bountyProof.deleteMany({
    where: {
      OR: [
        {
          bounty: {
            workspace: { ownerPubkey: pubkey },
          },
        },
        {
          bounty: {
            assigneePubkey: pubkey,
          },
        },
      ],
    },
  });

  // Delete bounties where user is owner OR assignee
  await db.bounty.deleteMany({
    where: {
      OR: [
        {
          workspace: { ownerPubkey: pubkey },
        },
        {
          assigneePubkey: pubkey,
        },
        {
          creatorPubkey: pubkey,
        },
      ],
    },
  });

  // Then workspace-related data
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

  // Finally the user and any notifications
  await db.notification.deleteMany({
    where: { userPubkey: pubkey },
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
