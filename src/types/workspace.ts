export interface WorkspaceBudget {
  id: string;
  workspaceId: string;
  totalBudget: string;
  availableBudget: string;
  reservedBudget: string;
  paidBudget: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userPubkey: string;
  role: string;
  joinedAt: string;
  user: {
    pubkey: string;
    username: string;
    alias: string | null;
    avatarUrl: string | null;
  };
}

export interface WorkspaceListItem {
  id: string;
  name: string;
  description: string | null;
  mission: string | null;
  avatarUrl: string | null;
  websiteUrl: string | null;
  githubUrl: string | null;
  ownerPubkey: string;
  createdAt: string;
  updatedAt: string;
  role: string;
  joinedAt: string;
  memberCount: number;
  bountyCount: number;
  budget: WorkspaceBudget | null;
}

export interface ListWorkspacesResponse {
  items: WorkspaceListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface WorkspaceDetailsResponse {
  id: string;
  name: string;
  description: string | null;
  mission: string | null;
  avatarUrl: string | null;
  websiteUrl: string | null;
  githubUrl: string | null;
  ownerPubkey: string;
  createdAt: string;
  updatedAt: string;
  role: string;
  memberCount: number;
  bountyCount: number;
  activityCount: number;
  budget: WorkspaceBudget | null;
  members: WorkspaceMember[];
}

export interface CreateWorkspaceResponse {
  workspace: {
    id: string;
    name: string;
    description: string | null;
    mission: string | null;
    avatarUrl: string | null;
    websiteUrl: string | null;
    githubUrl: string | null;
    ownerPubkey: string;
    createdAt: string;
    updatedAt: string;
    role: string;
    joinedAt: string;
    memberCount: number;
    bountyCount: number;
    budget: WorkspaceBudget | null;
  };
}

export interface UpdateWorkspaceResponse {
  workspace: {
    id: string;
    name: string;
    description: string | null;
    mission: string | null;
    avatarUrl: string | null;
    websiteUrl: string | null;
    githubUrl: string | null;
    ownerPubkey: string;
    createdAt: string;
    updatedAt: string;
    role: string;
    joinedAt: string;
    budget: WorkspaceBudget | null;
  };
}

export interface DeleteWorkspaceResponse {
  message: string;
}

export interface ListMembersResponse {
  members: WorkspaceMember[];
}

export interface AddMemberResponse {
  member: WorkspaceMember;
}

export interface UpdateMemberResponse {
  member: WorkspaceMember;
}

export interface RemoveMemberResponse {
  message: string;
}
