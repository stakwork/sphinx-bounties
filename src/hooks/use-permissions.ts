import { useQuery } from "@tanstack/react-query";
import { WorkspaceRole } from "@prisma/client";
import { useAuth } from "./use-auth";

const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  CONTRIBUTOR: 2,
  VIEWER: 1,
};

interface WorkspaceMember {
  role: WorkspaceRole;
}

async function fetchWorkspaceRole(
  pubkey: string,
  workspaceId: string
): Promise<WorkspaceRole | null> {
  const response = await fetch(`/api/workspaces/${workspaceId}/members/${pubkey}`, {
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  const result = await response.json();

  if (!result.success || !result.data) {
    return null;
  }

  const member: WorkspaceMember = result.data;
  return member.role;
}

export function usePermissions(workspaceId?: string) {
  const { user, isAuthenticated } = useAuth();

  const { data: role, isLoading } = useQuery({
    queryKey: ["workspace", workspaceId, "role", user?.pubkey],
    queryFn: () => fetchWorkspaceRole(user!.pubkey, workspaceId!),
    enabled: isAuthenticated && !!workspaceId && !!user,
    staleTime: 5 * 60 * 1000,
  });

  const hasRole = (requiredRole: WorkspaceRole): boolean => {
    if (!role) return false;
    return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole];
  };

  const isSuperAdmin = (): boolean => {
    return false;
  };

  const canManageWorkspace = (): boolean => {
    return hasRole(WorkspaceRole.ADMIN);
  };

  const canManageBounty = (): boolean => {
    return hasRole(WorkspaceRole.ADMIN);
  };

  const canContribute = (): boolean => {
    return hasRole(WorkspaceRole.CONTRIBUTOR);
  };

  const canView = (): boolean => {
    return hasRole(WorkspaceRole.VIEWER);
  };

  return {
    role,
    isLoading,
    hasRole,
    isSuperAdmin,
    canManageWorkspace,
    canManageBounty,
    canContribute,
    canView,
    isOwner: role === WorkspaceRole.OWNER,
    isAdmin: role === WorkspaceRole.ADMIN || role === WorkspaceRole.OWNER,
    isContributor: !!role && role !== WorkspaceRole.VIEWER,
    isMember: !!role,
  };
}
