import { SearchX } from "lucide-react";
import { EmptyState } from "./empty-state";

interface EmptySearchProps {
  searchTerm?: string;
  onClearSearch?: () => void;
}

export function EmptySearch({ searchTerm, onClearSearch }: EmptySearchProps) {
  return (
    <EmptyState
      icon={<SearchX className="size-6 text-muted-foreground" />}
      title="No results found"
      description={
        searchTerm
          ? `No results matching "${searchTerm}". Try different keywords.`
          : "No results found. Try adjusting your search."
      }
      actionLabel={onClearSearch ? "Clear Search" : undefined}
      onAction={onClearSearch}
    />
  );
}
