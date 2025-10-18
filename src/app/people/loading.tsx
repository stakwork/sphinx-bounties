import { Skeleton } from '@/components/ui/skeleton';
import { ListSkeleton } from '@/components/loading/list-skeleton';

export default function Loading() {
  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-10 w-64" />
      </div>
      <ListSkeleton items={8} />
    </div>
  );
}
