import { UserSearch } from "lucide-react";
import { EmptyState } from "./empty-state";

export function EmptyUsers() {
  return (
    <EmptyState
      icon={<UserSearch className="size-6 text-muted-foreground" />}
      title="No users found"
      description="Try adjusting your search filters or check back later."
    />
  );
}
