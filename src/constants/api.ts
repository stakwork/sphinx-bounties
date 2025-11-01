export const API_ROUTES = {
  AUTH: {
    CHALLENGE: "/api/auth/challenge",
    SESSION: "/api/auth/session",
    LOGOUT: "/api/auth/logout",
    DEV_LOGIN: "/api/auth/dev-login",
  },
  USERS: {
    BASE: "/api/users",
    BY_ID: (id: string) => `/api/users/${id}`,
    PROFILE: (id: string) => `/api/users/${id}/profile`,
    STATS: (id: string) => `/api/users/${id}/stats`,
  },
  BOUNTIES: {
    BASE: "/api/bounties",
    BY_ID: (id: string) => `/api/bounties/${id}`,
    ASSIGN: (id: string) => `/api/bounties/${id}/assign`,
    UNASSIGN: (id: string) => `/api/bounties/${id}/assign`,
    REQUESTS: (id: string) => `/api/bounties/${id}/requests`,
    REQUEST_BY_ID: (bountyId: string, requestId: string) =>
      `/api/bounties/${bountyId}/requests/${requestId}`,
    COMMENTS: (id: string) => `/api/bounties/${id}/comments`,
    COMMENT_BY_ID: (bountyId: string, commentId: string) =>
      `/api/bounties/${bountyId}/comments/${commentId}`,
    PROOFS: (id: string) => `/api/bounties/${id}/proofs`,
    PROOF_BY_ID: (bountyId: string, proofId: string) =>
      `/api/bounties/${bountyId}/proofs/${proofId}`,
    TIMING: (id: string) => `/api/bounties/${id}/timing`,
    TIMING_START: (id: string) => `/api/bounties/${id}/timing/start`,
    TIMING_CLOSE: (id: string) => `/api/bounties/${id}/timing/close`,
    PAYMENT: (id: string) => `/api/bounties/${id}/payment`,
    PAYMENT_STATUS: (id: string) => `/api/bounties/${id}/payment/status`,
  },
  WORKSPACES: {
    BASE: "/api/workspaces",
    BY_ID: (id: string) => `/api/workspaces/${id}`,
    MEMBERS: (id: string) => `/api/workspaces/${id}/members`,
    BOUNTIES: (id: string) => `/api/workspaces/${id}/bounties`,
    BOUNTY_BY_ID: (workspaceId: string, bountyId: string) =>
      `/api/workspaces/${workspaceId}/bounties/${bountyId}`,
    COMPLETE_BOUNTY: (workspaceId: string, bountyId: string) =>
      `/api/workspaces/${workspaceId}/bounties/${bountyId}/complete`,
    CANCEL_BOUNTY: (workspaceId: string, bountyId: string) =>
      `/api/workspaces/${workspaceId}/bounties/${bountyId}/cancel`,
    MARK_PAID: (workspaceId: string, bountyId: string) =>
      `/api/workspaces/${workspaceId}/bounties/${bountyId}/mark-paid`,
    BUDGET: (id: string) => `/api/workspaces/${id}/budget`,
    TRANSACTIONS: (id: string) => `/api/workspaces/${id}/transactions`,
    ACTIVITIES: (id: string) => `/api/workspaces/${id}/activities`,
    INVITES: (id: string) => `/api/workspaces/${id}/invites`,
  },
  PAYMENTS: {
    BASE: "/api/payments",
    BY_ID: (id: string) => `/api/payments/${id}`,
    INVOICE: (id: string) => `/api/payments/${id}/invoice`,
    WEBHOOK: "/api/payments/webhook",
  },
  NOTIFICATIONS: {
    BASE: "/api/notifications",
    BY_ID: (id: string) => `/api/notifications/${id}`,
    // API implements PATCH /api/notifications to mark all as read
    READ: (id: string) => `/api/notifications/${id}`,
    READ_ALL: "/api/notifications",
  },
  ADMIN: {
    WORKSPACES: "/api/admin/workspaces",
    WORKSPACES_STATS: (id: string) => `/api/admin/workspaces/${id}/stats`,
    ANALYTICS: "/api/admin/analytics",
    TRANSACTIONS: "/api/admin/transactions",
  },
  LEADERBOARD: "/api/leaderboard",
} as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  BOUNTIES: {
    LIST: "/bounties",
    DETAILS: (id: string) => `/bounties/${id}`,
    CREATE: "/bounties/new",
    EDIT: (id: string) => `/bounties/${id}/edit`,
  },
  WORKSPACES: {
    LIST: "/workspaces",
    DETAILS: (id: string) => `/workspaces/${id}`,
    CREATE: "/workspaces/new",
    EDIT: (id: string) => `/workspaces/${id}/edit`,
    SETTINGS: (id: string) => `/workspaces/${id}/settings`,
  },
  PROFILE: {
    VIEW: (pubkey: string) => `/people/${pubkey}`,
    EDIT: "/settings/profile",
  },
  PEOPLE: "/people",
  LEADERBOARD: "/leaderboard",
  SETTINGS: {
    BASE: "/settings",
    PROFILE: "/settings/profile",
    ACCOUNT: "/settings/account",
    NOTIFICATIONS: "/settings/notifications",
  },
  ADMIN: {
    DASHBOARD: "/admin",
    USERS: "/admin/users",
    BOUNTIES: "/admin/bounties",
    WORKSPACES: "/admin/workspaces",
  },
  UNAUTHORIZED: "/unauthorized",
} as const;

export const EXTERNAL_APIS = {
  LIGHTNING_NODE: process.env.NEXT_PUBLIC_LIGHTNING_NODE_URL,
  NOSTR_RELAY: process.env.NEXT_PUBLIC_NOSTR_RELAY_URL,
} as const;
