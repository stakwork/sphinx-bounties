import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/loading/table-skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <TableSkeleton rows={10} />
    </div>
  );
}
