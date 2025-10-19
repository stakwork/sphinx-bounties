import {
  PUBLIC_ROUTES,
  AUTH_ROUTES,
  PROTECTED_ROUTES,
  WORKSPACE_ROUTES_PATTERN,
  ADMIN_ROUTES_PATTERN,
} from "./constants";
import { isSuperAdmin } from "./permissions";
import type { Session } from "@/types/auth";

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

export function requiresAuth(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

export function requiresSuperAdmin(pathname: string, session: Session | null): boolean {
  if (!ADMIN_ROUTES_PATTERN.test(pathname)) return false;
  if (!session) return true;
  return !isSuperAdmin(session.pubkey);
}

export function extractWorkspaceId(pathname: string): string | null {
  const match = pathname.match(/^\/workspaces\/([^\/]+)/);
  return match ? match[1] : null;
}

export function isWorkspaceManagementRoute(pathname: string): boolean {
  return WORKSPACE_ROUTES_PATTERN.test(pathname);
}
