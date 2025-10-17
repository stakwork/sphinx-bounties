export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    REGISTER: "/api/auth/register",
  },
  USERS: {
    BASE: "/api/users",
    BY_ID: (id: string) => `/api/users/${id}`,
  },
} as const;

export const EXTERNAL_APIS = {
  PLACEHOLDER: "https://api.example.com",
} as const;
