"use client";

import { useGetBounty } from "@/hooks/queries/use-bounty-queries";
import { usePermissions } from "@/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, CurrencyDisplay, AvatarWithFallback } from "@/components/common";
import { BountyActions } from "./BountyActions";
import { BountyComments } from "./BountyComments";
import { BountyProofs } from "./BountyProofs";
import { BountyRequestsList } from "./BountyRequestsList";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Building2 } from "lucide-react";

interface BountyDetailProps {
  bountyId: string;
}

export function BountyDetail({ bountyId }: BountyDetailProps) {
  const { data: bounty, isLoading, error } = useGetBounty(bountyId);
  const { isAdmin } = usePermissions(bounty?.workspace.id || "");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !bounty) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">Failed to load bounty details.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{bounty.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={bounty.status} />
              <CurrencyDisplay amount={bounty.amount} size="lg" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>{bounty.workspace.name}</span>
          </div>
          {bounty.estimatedHours && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{bounty.estimatedHours} hours</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Created {new Date(bounty.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <h3 className="text-lg font-semibold">Description</h3>
        <p className="whitespace-pre-wrap">{bounty.description}</p>
      </div>

      {bounty.codingLanguages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Technologies</h3>
          <div className="flex flex-wrap gap-2">
            {bounty.codingLanguages.map((lang: string) => (
              <Badge key={lang} variant="secondary">
                {lang}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {bounty.tags.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {bounty.tags.map((tag: string) => (
              <span
                key={tag}
                className="text-sm text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
        <div>
          <h3 className="text-sm font-semibold text-neutral-600 mb-2">Creator</h3>
          <div className="flex items-center gap-3">
            <AvatarWithFallback
              src={bounty.creator.avatarUrl}
              alt={bounty.creator.alias || bounty.creator.username}
              size="md"
            />
            <div>
              <p className="font-medium">{bounty.creator.alias || bounty.creator.username}</p>
              {bounty.creator.alias && (
                <p className="text-sm text-neutral-500">@{bounty.creator.username}</p>
              )}
            </div>
          </div>
        </div>

        {bounty.assignee && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-600 mb-2">Assigned To</h3>
            <div className="flex items-center gap-3">
              <AvatarWithFallback
                src={bounty.assignee.avatarUrl}
                alt={bounty.assignee.alias || bounty.assignee.username}
                size="md"
              />
              <div>
                <p className="font-medium">{bounty.assignee.alias || bounty.assignee.username}</p>
                {bounty.assignee.alias && (
                  <p className="text-sm text-neutral-500">@{bounty.assignee.username}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <BountyActions bounty={bounty} />
      </div>

      {/* Work Requests Section (Admin Only) */}
      {isAdmin && (
        <div className="pt-6 border-t border-neutral-200">
          <BountyRequestsList bounty={bounty} />
        </div>
      )}

      {/* Proof Submissions Section */}
      <div className="pt-6 border-t border-neutral-200">
        <BountyProofs bounty={bounty} />
      </div>

      {/* Comments Section */}
      <div className="pt-6 border-t border-neutral-200">
        <BountyComments bounty={bounty} />
      </div>
    </div>
  );
}
