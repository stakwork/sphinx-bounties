import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign } from "lucide-react";
import type { BountyListItem } from "@/types";
import { StatusBadge, CurrencyDisplay, AvatarWithFallback } from "@/components/common";

interface BountyCardProps {
  bounty: BountyListItem;
}

export function BountyCard({ bounty }: BountyCardProps) {
  return (
    <Link href={`/bounties/${bounty.id}`}>
      <Card className="h-full transition-all hover:shadow-lg hover:border-primary-300 cursor-pointer">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg line-clamp-2">{bounty.title}</h3>
            <StatusBadge status={bounty.status} size="sm" className="shrink-0" />
          </div>
          <p className="text-sm text-neutral-600 line-clamp-2">{bounty.description}</p>
        </CardHeader>

        <CardContent className="space-y-3">
          <CurrencyDisplay amount={bounty.amount} size="md" className="text-primary-700" />

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
              <div className="flex items-center gap-1.5">
                <AvatarWithFallback
                  src={bounty.assignee.avatarUrl}
                  alt={bounty.assignee.alias || bounty.assignee.username}
                  size="sm"
                  className="h-5 w-5"
                />
                <span className="text-xs">{bounty.assignee.alias || bounty.assignee.username}</span>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
