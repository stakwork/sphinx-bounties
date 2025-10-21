import type { BountyStatus, ProgrammingLanguage } from "@prisma/client";

export interface BountyListItem {
  id: string;
  title: string;
  description: string;
  amount: string;
  status: BountyStatus;
  tags: string[];
  codingLanguages: ProgrammingLanguage[];
  estimatedCompletionDate: string | null;
  githubIssueUrl: string | null;
  createdAt: string;
  updatedAt: string;
  creator: {
    pubkey: string;
    username: string;
  };
  assignee: {
    pubkey: string;
    username: string;
  } | null;
  _count: {
    proofs: number;
  };
}

export interface CreateBountyResponse {
  id: string;
  title: string;
  description: string;
  deliverables: string;
  amount: string;
  status: BountyStatus;
  tags: string[];
  codingLanguages: ProgrammingLanguage[];
  estimatedCompletionDate: string | null;
  githubIssueUrl: string | null;
  createdAt: string;
  creator: {
    pubkey: string;
    username: string;
  };
}

export interface ListBountiesResponse {
  bounties: BountyListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BountyDetailsResponse {
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
    avatarUrl: string | null;
  };
  proofs: Array<{
    id: string;
    proofUrl: string;
    description: string;
    status: string;
    createdAt: string;
    submitter: {
      pubkey: string;
      username: string;
      alias: string | null;
    };
  }>;
  activities: Array<{
    id: string;
    action: string;
    timestamp: string;
    user: {
      pubkey: string;
      username: string;
      alias: string | null;
    };
  }>;
  _count: {
    proofs: number;
    activities: number;
  };
}

export interface ClaimBountyResponse {
  message: string;
}

export interface UnclaimBountyResponse {
  message: string;
}

export interface UpdateBountyResponse {
  message: string;
  bounty: CreateBountyResponse;
}

export interface CompleteBountyResponse {
  message: string;
}

export interface CancelBountyResponse {
  message: string;
}
