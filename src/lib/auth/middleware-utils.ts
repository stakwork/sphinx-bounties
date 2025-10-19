import {
  PUBLIC_ROUTES,
  AUTH_ROUTES,
  PROTECTED_ROUTES,
  WORKSPACE_ROUTES_PATTERN,
  ADMIN_ROUTES_PATTERN,
} from "./constants";
import { isSuperAdmin, getUserWorkspaceRole } from "./permissions";
import { WorkspaceRole } from "@prisma/client";
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

export async function requiresSuperAdmin(
  pathname: string,
  session: Session | null
): Promise<boolean> {
  if (!ADMIN_ROUTES_PATTERN.test(pathname)) return false;
  if (!session) return true;
  return !isSuperAdmin(session.pubkey);
}

export async function requiresWorkspaceAccess(
  pathname: string,
  session: Session | null
): Promise<{ required: boolean; allowed: boolean; workspaceId?: string }> {
  const match = pathname.match(/^\/workspaces\/([^\/]+)/);
  if (!match) return { required: false, allowed: true };

  const workspaceId = match[1];
  const isManagementRoute = WORKSPACE_ROUTES_PATTERN.test(pathname);

  if (!isManagementRoute) {
    return { required: false, allowed: true, workspaceId };
  }

  if (!session) {
    return { required: true, allowed: false, workspaceId };
  }

  const role = await getUserWorkspaceRole(session.pubkey, workspaceId);
  const allowed = role === WorkspaceRole.OWNER || role === WorkspaceRole.ADMIN;

  return { required: true, allowed, workspaceId };
}
