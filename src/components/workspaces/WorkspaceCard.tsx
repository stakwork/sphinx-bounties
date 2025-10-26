"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay, AvatarWithFallback } from "@/components/common";
import { Users, Target, Calendar } from "lucide-react";
import type { WorkspaceListItem } from "@/types";

interface WorkspaceCardProps {
  workspace: WorkspaceListItem;
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const availableBudget = workspace.budget?.availableBudget
    ? parseInt(workspace.budget.availableBudget)
    : 0;

  return (
    <Link href={`/workspaces/${workspace.id}`}>
      <Card className="h-full transition-all hover:shadow-lg hover:border-primary-300 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <AvatarWithFallback src={workspace.avatarUrl} alt={workspace.name} size="lg" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{workspace.name}</h3>
              <Badge variant="secondary" className="mt-1">
                {workspace.role}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {workspace.description && (
            <p className="text-sm text-neutral-600 line-clamp-2">{workspace.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-neutral-500" />
              <div>
                <p className="text-xs text-neutral-500">Bounties</p>
                <p className="font-semibold">{workspace.bountyCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-neutral-500" />
              <div>
                <p className="text-xs text-neutral-500">Members</p>
                <p className="font-semibold">{workspace.memberCount}</p>
              </div>
            </div>
          </div>

          {workspace.budget && (
            <div className="pt-3 border-t border-neutral-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Available Budget</span>
                <CurrencyDisplay amount={availableBudget} size="sm" />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-neutral-500 pt-2">
            <Calendar className="h-3 w-3" />
            <span>Joined {new Date(workspace.joinedAt).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
