"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BountyForm } from "@/components/bounties";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { BountyDetail } from "@/types";

export default function EditBountyPage() {
  const params = useParams();
  const router = useRouter();
  const bountyId = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ["bounty", bountyId],
    queryFn: async () => {
      const response = await fetch(`/api/bounties/${bountyId}`);
      if (!response.ok) throw new Error("Failed to fetch bounty");
      const result = await response.json();
      return result.data as BountyDetail;
    },
    enabled: !!bountyId,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="text-center py-12 border border-dashed border-neutral-300 rounded-lg">
          <AlertCircle className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Bounty Not Found</h3>
          <p className="text-neutral-600 mb-4">
            The bounty you&apos;re trying to edit doesn&apos;t exist or you don&apos;t have
            permission.
          </p>
          <Link href="/bounties">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bounties
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Bounty</h1>
          <p className="text-neutral-600">Update bounty details</p>
        </div>
      </div>

      <BountyForm
        workspaceId={data.workspace.id}
        bounty={data}
        onSuccess={() => router.push(`/bounties/${bountyId}`)}
      />
    </div>
  );
}
