"use client";

import type { ReactNode } from "react";
import type { WorkspaceRole } from "@prisma/client";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/hooks/use-auth";

interface PermissionGateProps {
  children: ReactNode;
  workspaceId?: string;
  requires?: WorkspaceRole;
  requiresAny?: WorkspaceRole[];
  requiresAuth?: boolean;
  fallback?: ReactNode;
  onUnauthorized?: () => void;
}

export function PermissionGate({
  children,
  workspaceId,
  requires,
  requiresAny,
  requiresAuth = false,
  fallback = null,
  onUnauthorized,
}: PermissionGateProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasRole, isLoading: permLoading } = usePermissions(workspaceId);

  if (authLoading || (workspaceId && permLoading)) {
    return <>{fallback}</>;
  }

  if (requiresAuth && !isAuthenticated) {
    onUnauthorized?.();
    return <>{fallback}</>;
  }

  if (requires && workspaceId) {
    const authorized = hasRole(requires);
    if (!authorized) {
      onUnauthorized?.();
      return <>{fallback}</>;
    }
  }

  if (requiresAny && workspaceId) {
    const authorized = requiresAny.some((role) => hasRole(role));
    if (!authorized) {
      onUnauthorized?.();
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}
