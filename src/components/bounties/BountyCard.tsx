import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, User, Zap } from "lucide-react";
import type { BountyStatus } from "@/types/enums";
import type { BountyListItem } from "@/types";

interface BountyCardProps {
  bounty: BountyListItem;
}

const STATUS_STYLES: Record<BountyStatus, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: "bg-neutral-100", text: "text-neutral-700", label: "Draft" },
  OPEN: { bg: "bg-secondary-100", text: "text-secondary-700", label: "Open" },
  ASSIGNED: { bg: "bg-primary-100", text: "text-primary-700", label: "Assigned" },
  IN_REVIEW: { bg: "bg-tertiary-100", text: "text-tertiary-700", label: "In Review" },
  COMPLETED: { bg: "bg-secondary-100", text: "text-secondary-700", label: "Completed" },
  PAID: { bg: "bg-secondary-200", text: "text-secondary-800", label: "Paid" },
  CANCELLED: { bg: "bg-neutral-100", text: "text-neutral-500", label: "Cancelled" },
};

export function BountyCard({ bounty }: BountyCardProps) {
  const statusStyle = STATUS_STYLES[bounty.status];

  return (
    <Link href={`/bounties/${bounty.id}`}>
      <Card className="h-full transition-all hover:shadow-lg hover:border-primary-300 cursor-pointer">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg line-clamp-2">{bounty.title}</h3>
            <Badge className={`${statusStyle.bg} ${statusStyle.text} shrink-0`}>
              {statusStyle.label}
            </Badge>
          </div>
          <p className="text-sm text-neutral-600 line-clamp-2">{bounty.description}</p>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-primary-700 font-semibold">
            <Zap className="h-4 w-4 fill-current" />
            <span>{bounty.amount.toLocaleString()} sats</span>
          </div>

          {bounty.codingLanguages.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {bounty.codingLanguages.slice(0, 3).map((lang) => (
                <Badge key={lang} variant="outline" className="text-xs">
                  {lang}
                </Badge>
              ))}
              {bounty.codingLanguages.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{bounty.codingLanguages.length - 3}
                </Badge>
              )}
            </div>
          )}

          {bounty.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {bounty.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between text-sm text-neutral-600 border-t pt-4">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span className="text-xs">{bounty.workspace.name}</span>
          </div>

          <div className="flex items-center gap-3">
            {bounty.estimatedHours && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="text-xs">{bounty.estimatedHours}h</span>
              </div>
            )}
            {bounty.assignee && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="text-xs">{bounty.assignee.alias || bounty.assignee.username}</span>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
