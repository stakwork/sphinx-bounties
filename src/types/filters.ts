import type { BountyStatus } from "@prisma/client";
import type { SortParams } from "@/types";

export type BountyFilters = {
  status?: BountyStatus;
  workspaceId?: string;
  assigneePubkey?: string;
  creatorPubkey?: string;
  search?: string;
  tags?: string[];
  programmingLanguages?: string[];
};

export type BountySortParams = SortParams & {
  sortBy?: "createdAt" | "updatedAt" | "amount" | "deadline";
};

export type WorkspaceFilters = {
  ownerPubkey?: string;
  search?: string;
  hasActiveBounties?: boolean;
};

export type WorkspaceSortParams = SortParams & {
  sortBy?: "createdAt" | "updatedAt" | "name";
};

export type UserFilters = {
  search?: string;
  githubVerified?: boolean;
  twitterVerified?: boolean;
};

export type UserSortParams = SortParams & {
  sortBy?: "createdAt" | "updatedAt" | "username" | "lastLogin";
};
