import type { WorkspaceRole } from "@prisma/client";

export interface JWTPayload {
  pubkey: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface Session {
  pubkey: string;
  expiresAt: Date;
}

export interface AuthUser {
  id: string;
  pubkey: string;
  username: string;
  alias: string | null;
  avatarUrl: string | null;
}

export interface WorkspacePermission {
  workspaceId: string;
  role: WorkspaceRole;
}

export interface RouteProtection {
  requireAuth: boolean;
  requireRoles?: WorkspaceRole[];
  requireSuperAdmin?: boolean;
  workspaceIdParam?: string;
}
