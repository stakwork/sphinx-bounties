import { Skeleton } from "@/components/ui/skeleton";

export function WorkspaceSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      <div className="flex gap-4 pt-4 border-t">
        <div className="flex-1">
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-5 w-12" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-5 w-14" />
        </div>
      </div>
    </div>
  );
}
