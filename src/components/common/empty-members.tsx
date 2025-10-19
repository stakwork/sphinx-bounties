import { Users } from "lucide-react";
import { EmptyState } from "./empty-state";

interface EmptyMembersProps {
  onAddMember?: () => void;
}

export function EmptyMembers({ onAddMember }: EmptyMembersProps) {
  return (
    <EmptyState
      icon={<Users className="size-6 text-muted-foreground" />}
      title="No members yet"
      description="Add members to collaborate on bounties and manage the workspace together."
      actionLabel={onAddMember ? "Add Member" : undefined}
      onAction={onAddMember}
    />
  );
}
