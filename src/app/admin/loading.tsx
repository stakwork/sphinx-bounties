import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton } from "@/components/loading/card-skeleton";
import { TableSkeleton } from "@/components/loading/table-skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <Skeleton className="h-10 w-1/4" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <TableSkeleton rows={6} />
      </div>
    </div>
  );
}
