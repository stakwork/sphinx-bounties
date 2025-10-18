import { Skeleton } from '@/components/ui/skeleton';
import { BountySkeleton } from '@/components/loading/bounty-skeleton';

export default function Loading() {
  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <BountySkeleton />
        <BountySkeleton />
        <BountySkeleton />
        <BountySkeleton />
      </div>
    </div>
  );
}
