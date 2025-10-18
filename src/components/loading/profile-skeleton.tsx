import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-6 items-start">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-4 mt-4">
            <div>
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-6 w-12" />
            </div>
            <div>
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-6 w-16" />
            </div>
            <div>
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-6 w-14" />
            </div>
          </div>
        </div>
      </div>
      <div className="border-t pt-6 space-y-3">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}
