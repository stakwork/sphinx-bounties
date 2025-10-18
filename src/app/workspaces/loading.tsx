import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceSkeleton } from "@/components/loading/workspace-skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <WorkspaceSkeleton />
        <WorkspaceSkeleton />
        <WorkspaceSkeleton />
        <WorkspaceSkeleton />
        <WorkspaceSkeleton />
        <WorkspaceSkeleton />
      </div>
    </div>
  );
}
