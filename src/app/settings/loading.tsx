import { Skeleton } from "@/components/ui/skeleton";
import { FormSkeleton } from "@/components/loading/form-skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto py-10 max-w-2xl space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <FormSkeleton fields={3} />
        </div>
        <div className="border-t pt-6 space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <FormSkeleton fields={2} />
        </div>
      </div>
    </div>
  );
}
