"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useGetBounty } from "@/hooks/queries/use-bounty-queries";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Zap, Clock, User, Building2, Calendar, ExternalLink } from "lucide-react";

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: "bg-neutral-100", text: "text-neutral-700", label: "Draft" },
  OPEN: { bg: "bg-secondary-100", text: "text-secondary-700", label: "Open" },
  ASSIGNED: { bg: "bg-primary-100", text: "text-primary-700", label: "Assigned" },
  IN_REVIEW: { bg: "bg-tertiary-100", text: "text-tertiary-700", label: "In Review" },
  COMPLETED: { bg: "bg-secondary-100", text: "text-secondary-700", label: "Completed" },
  PAID: { bg: "bg-secondary-200", text: "text-secondary-800", label: "Paid" },
  CANCELLED: { bg: "bg-neutral-100", text: "text-neutral-500", label: "Cancelled" },
};

export default function BountyModalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = useGetBounty(id);

  const handleClose = () => {
    router.back();
  };

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {data && (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <DialogTitle className="text-2xl font-bold pr-8">{data.title}</DialogTitle>
                <Badge
                  className={`${STATUS_STYLES[data.status].bg} ${STATUS_STYLES[data.status].text} shrink-0`}
                >
                  {STATUS_STYLES[data.status].label}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg">
                  <Zap className="h-5 w-5 fill-current" />
                  <span>{Number(data.amount).toLocaleString()} sats</span>
                </div>

                {data.estimatedHours && (
                  <div className="flex items-center gap-1 text-neutral-600">
                    <Clock className="h-4 w-4" />
                    <span>{data.estimatedHours}h estimated</span>
                  </div>
                )}

                <div className="flex items-center gap-1 text-neutral-600">
                  <Building2 className="h-4 w-4" />
                  <span>{data.workspace.name}</span>
                </div>

                <div className="flex items-center gap-1 text-neutral-600">
                  <Calendar className="h-4 w-4" />
                  <span>{formatTimeAgo(new Date(data.createdAt))}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Description</h3>
                  <p className="text-neutral-700 whitespace-pre-wrap">{data.description}</p>
                </div>

                {data.deliverables && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Deliverables</h3>
                    <p className="text-neutral-700 whitespace-pre-wrap">{data.deliverables}</p>
                  </div>
                )}
              </div>

              {(data.codingLanguages.length > 0 || data.tags.length > 0) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    {data.codingLanguages.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Tech Stack</h4>
                        <div className="flex flex-wrap gap-2">
                          {data.codingLanguages.map((lang: string) => (
                            <Badge key={lang} variant="outline">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {data.tags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {data.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="text-xs text-neutral-600 bg-neutral-100 px-2 py-1 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-neutral-500 mb-1">Created by</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-neutral-400" />
                    <span className="font-medium">
                      {data.creator.alias || data.creator.username}
                    </span>
                  </div>
                </div>

                {data.assignee && (
                  <div>
                    <p className="text-neutral-500 mb-1">Assigned to</p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-neutral-400" />
                      <span className="font-medium">
                        {data.assignee.alias || data.assignee.username}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {(data.githubIssueUrl || data.loomVideoUrl) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    {data.githubIssueUrl && (
                      <a
                        href={data.githubIssueUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View GitHub Issue
                      </a>
                    )}
                    {data.loomVideoUrl && (
                      <a
                        href={data.loomVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Watch Loom Video
                      </a>
                    )}
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4">
                {data.status === "OPEN" && <Button className="flex-1">Claim Bounty</Button>}
                {data.status === "ASSIGNED" && <Button className="flex-1">Submit Work</Button>}
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
