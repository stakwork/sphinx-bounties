import { env } from "@/lib/env";

export const AUTH_COOKIE_NAME = "sphinx_session";
export const AUTH_HEADER_NAME = "x-user-pubkey";
export const WORKSPACE_HEADER_NAME = "x-workspace-id";

export const COOKIE_MAX_AGE = env.JWT_EXPIRY_HOURS;

import { API_ROUTES } from "@/constants/api";

export const PUBLIC_ROUTES = ["/", "/login", "/bounties", "/workspaces", "/people", "/leaderboard"];

export const AUTH_ROUTES = [API_ROUTES.AUTH.CHALLENGE];

export const PROTECTED_ROUTES = ["/bounties/new", "/settings", "/admin"];

export const WORKSPACE_ROUTES_PATTERN = /^\/workspaces\/[^\/]+\/(edit|settings)/;
export const BOUNTY_EDIT_PATTERN = /^\/bounties\/[^\/]+\/edit/;
export const ADMIN_ROUTES_PATTERN = /^\/admin/;
