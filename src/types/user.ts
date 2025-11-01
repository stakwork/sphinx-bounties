export interface UserProfile {
  pubkey: string;
  username: string;
  alias: string | null;
  description: string | null;
  avatarUrl: string | null;
  contactKey: string | null;
  routeHint: string | null;
  githubUsername: string | null;
  githubVerified: boolean;
  twitterUsername: string | null;
  twitterVerified: boolean;
  createdAt: string;
  lastLogin: string | null;
  stats: {
    totalEarned: string;
    bountiesCompleted: number;
    bountiesCreated: number;
    activeBounties: number;
    workspacesCount: number;
  };
}

export type UserProfileResponse = UserProfile;

export interface UpdateUserResponse {
  pubkey: string;
  username: string;
  alias: string | null;
  description: string | null;
  avatarUrl: string | null;
  contactKey: string | null;
  routeHint: string | null;
  githubUsername: string | null;
  twitterUsername: string | null;
}

export interface UserStats {
  totalEarned: string;
  bountiesCompleted: number;
  bountiesCreated: number;
  bountiesAssigned: number;
  activeBounties: number;
  workspacesCount: number;
  successRate: number;
  averageCompletionTime: number | null;
  topSkills: Array<{
    language: string;
    count: number;
  }>;
}

export interface UserStatsResponse {
  stats: UserStats;
}

export interface UserBountyItem {
  id: string;
  title: string;
  description: string;
  amount: string;
  status: string;
  tags: string[];
  codingLanguages: string[];
  createdAt: string;
  completedAt: string | null;
  workspace: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  assignee?: {
    pubkey: string;
    username: string;
    alias: string | null;
  } | null;
  creator?: {
    pubkey: string;
    username: string;
    alias: string | null;
  };
}

export interface UserBountiesResponse {
  bounties: UserBountyItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
