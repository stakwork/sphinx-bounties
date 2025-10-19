import { Building2 } from "lucide-react";
import { EmptyState } from "./empty-state";

interface EmptyWorkspacesProps {
  onCreateWorkspace?: () => void;
}

export function EmptyWorkspaces({ onCreateWorkspace }: EmptyWorkspacesProps) {
  return (
    <EmptyState
      icon={<Building2 className="size-6 text-muted-foreground" />}
      title="No workspaces found"
      description="Workspaces help you organize bounties and collaborate with your team."
      actionLabel={onCreateWorkspace ? "Create Workspace" : undefined}
      onAction={onCreateWorkspace}
    />
  );
}
