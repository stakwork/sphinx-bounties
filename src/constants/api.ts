export const API_ROUTES = {
  AUTH: {
    CHALLENGE: "/api/auth/challenge",
    VERIFY: "/api/auth/verify",
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
    CLAIM: (id: string) => `/api/bounties/${id}/claim`,
    UNCLAIM: (id: string) => `/api/bounties/${id}/unclaim`,
    COMPLETE: (id: string) => `/api/bounties/${id}/complete`,
    VERIFY: (id: string) => `/api/bounties/${id}/verify`,
    COMMENTS: (id: string) => `/api/bounties/${id}/comments`,
  },
  WORKSPACES: {
    BASE: "/api/workspaces",
    BY_ID: (id: string) => `/api/workspaces/${id}`,
    MEMBERS: (id: string) => `/api/workspaces/${id}/members`,
    BOUNTIES: (id: string) => `/api/workspaces/${id}/bounties`,
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
  },
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
