import type { BountyStatus, ProgrammingLanguage } from "./enums";
import type { ApiResponse, PaginationMeta } from "./api";

export interface BountiesResponse {
  success: true;
  data: BountyListItem[];
  meta: {
    timestamp: string;
    pagination: PaginationMeta;
  };
}

export type BountyDetailResponse = ApiResponse<BountyDetail>;

export interface BountyListItem {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: BountyStatus;
  tags: string[];
  codingLanguages: ProgrammingLanguage[];
  estimatedHours: number | null;
  estimatedCompletionDate: string | null;
  githubIssueUrl: string | null;
  createdAt: string;
  updatedAt: string;
  workspace: {
    id: string;
    name: string;
  };
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
  _count?: {
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

export interface BountyDetail {
  id: string;
  title: string;
  description: string;
  deliverables: string;
  amount: number;
  status: BountyStatus;
  tags: string[];
  codingLanguages: ProgrammingLanguage[];
  estimatedHours: number | null;
  estimatedCompletionDate: Date | null;
  githubIssueUrl: string | null;
  loomVideoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  assignedAt: Date | null;
  completedAt: Date | null;
  paidAt: Date | null;
  workStartedAt: Date | null;
  workClosedAt: Date | null;
  workspace: {
    id: string;
    name: string;
    description: string | null;
    avatarUrl: string | null;
    websiteUrl: string | null;
    githubUrl: string | null;
    ownerPubkey: string;
  };
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
    description: string | null;
    githubUsername: string | null;
    twitterUsername: string | null;
  } | null;
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
      avatarUrl: string | null;
    };
  }>;
}

export interface ClaimBountyResponse {
  message: string;
}

export interface UnclaimBountyResponse {
  message: string;
}

export interface UpdateBountyResponse {
  message: string;
  bounty: {
    id: string;
    title: string;
    description: string;
    deliverables: string;
    amount: string;
    status: string;
    tags: string[];
    codingLanguages: string[];
    estimatedHours: number | null;
    estimatedCompletionDate: string | null;
    githubIssueUrl: string | null;
    loomVideoUrl: string | null;
  };
}

export interface CompleteBountyResponse {
  message: string;
}

export interface CancelBountyResponse {
  message: string;
}

// Proof types
export interface BountyProof {
  id: string;
  bountyId: string;
  proofUrl: string;
  description: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CHANGES_REQUESTED";
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  submitter: {
    pubkey: string;
    username: string;
    alias: string | null;
    avatarUrl: string | null;
  };
  reviewer: {
    pubkey: string;
    username: string;
    alias: string | null;
  } | null;
}

export interface SubmitProofResponse {
  message: string;
  proof: {
    id: string;
    bountyId: string;
    proofUrl: string;
    description: string;
    status: string;
    createdAt: string;
  };
}

export interface ListProofsResponse {
  proofs: BountyProof[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ReviewProofResponse {
  message: string;
  proof: {
    id: string;
    status: string;
    reviewNotes: string | null;
    reviewedAt: string;
    reviewedBy: {
      pubkey: string;
      username: string;
    };
  };
}

export interface DeleteProofResponse {
  message: string;
}

// Payment types
export interface BountyTransaction {
  id: string;
  bountyId: string;
  workspaceId: string;
  type: "PAYMENT";
  amount: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "EXPIRED";
  lightningInvoice: string | null;
  paymentHash: string | null;
  preimage: string | null;
  memo: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  fromUser: {
    pubkey: string;
    username: string;
  } | null;
  toUser: {
    pubkey: string;
    username: string;
    alias: string | null;
  } | null;
}

export interface ProcessPaymentResponse {
  message: string;
  transaction: {
    id: string;
    amount: string;
    status: string;
    paymentHash: string | null;
    createdAt: string;
  };
}

export interface GetPaymentResponse {
  transaction: BountyTransaction | null;
  bounty: {
    id: string;
    title: string;
    amount: string;
    status: string;
    assignee: {
      pubkey: string;
      username: string;
    } | null;
  };
}

export interface UpdatePaymentStatusResponse {
  message: string;
  transaction: {
    id: string;
    status: string;
    completedAt: string | null;
    errorMessage: string | null;
  };
}

// Comment types
export interface BountyComment {
  id: string;
  bountyId: string;
  authorPubkey: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  author: {
    pubkey: string;
    username: string;
    alias: string | null;
    avatarUrl: string | null;
  };
}

export interface ListCommentsResponse {
  items: BountyComment[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface CreateCommentResponse {
  comment: BountyComment;
}

export interface UpdateCommentResponse {
  comment: BountyComment;
}

export interface DeleteCommentResponse {
  message: string;
}
