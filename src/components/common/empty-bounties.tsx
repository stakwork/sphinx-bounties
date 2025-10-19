import { Coins } from "lucide-react";
import { EmptyState } from "./empty-state";

interface EmptyBountiesProps {
  onCreateBounty?: () => void;
}

export function EmptyBounties({ onCreateBounty }: EmptyBountiesProps) {
  return (
    <EmptyState
      icon={<Coins className="size-6 text-muted-foreground" />}
      title="No bounties yet"
      description="Create your first bounty to start rewarding contributors for their work."
      actionLabel={onCreateBounty ? "Create Bounty" : undefined}
      onAction={onCreateBounty}
    />
  );
}
