import type { Bounty, BountyProof } from "@prisma/client";
import { BountyStatus, ProofStatus } from "@prisma/client";
import { generateTestPubkey } from "../utils";

export const mockBounty = (overrides?: Partial<Bounty>): Bounty => {
  const timestamp = Date.now();

  return {
    id: overrides?.id || `bounty_${timestamp}`,
    title: overrides?.title || `Test Bounty ${timestamp}`,
    description: overrides?.description || "Mock bounty description",
    deliverables: overrides?.deliverables || "Mock deliverables",
    workspaceId: overrides?.workspaceId || `workspace_${timestamp}`,
    creatorPubkey: overrides?.creatorPubkey || generateTestPubkey(),
    assigneePubkey: overrides?.assigneePubkey || null,
    status: overrides?.status || BountyStatus.OPEN,
    amount: overrides?.amount || 10000,
    codingLanguages: overrides?.codingLanguages || [],
    tags: overrides?.tags || [],
    estimatedHours: overrides?.estimatedHours || null,
    estimatedCompletionDate: overrides?.estimatedCompletionDate || null,
    githubIssueUrl: overrides?.githubIssueUrl || null,
    loomVideoUrl: overrides?.loomVideoUrl || null,
    createdAt: overrides?.createdAt || new Date(),
    updatedAt: overrides?.updatedAt || new Date(),
    assignedAt: overrides?.assignedAt || null,
    completedAt: overrides?.completedAt || null,
    paidAt: overrides?.paidAt || null,
    workStartedAt: overrides?.workStartedAt || null,
    workClosedAt: overrides?.workClosedAt || null,
    deletedAt: overrides?.deletedAt || null,
  };
};

export const mockBountyProof = (overrides?: Partial<BountyProof>): BountyProof => {
  const timestamp = Date.now();

  return {
    id: overrides?.id || `proof_${timestamp}`,
    bountyId: overrides?.bountyId || `bounty_${timestamp}`,
    submittedByPubkey: overrides?.submittedByPubkey || generateTestPubkey(),
    proofUrl: overrides?.proofUrl || `https://github.com/pr/${timestamp}`,
    description: overrides?.description || "Mock proof description",
    status: overrides?.status || ProofStatus.PENDING,
    reviewNotes: overrides?.reviewNotes || null,
    reviewedByPubkey: overrides?.reviewedByPubkey || null,
    reviewedAt: overrides?.reviewedAt || null,
    createdAt: overrides?.createdAt || new Date(),
    updatedAt: overrides?.updatedAt || new Date(),
  };
};

export const mockBountyWithRelations = (overrides?: {
  bounty?: Partial<Bounty>;
  proofCount?: number;
  workspaceName?: string;
}) => {
  const bounty = mockBounty(overrides?.bounty);

  return {
    ...bounty,
    amount: bounty.amount.toString(),
    proofCount: overrides?.proofCount || 0,
    workspace: {
      name: overrides?.workspaceName || "Test Workspace",
    },
  };
};
