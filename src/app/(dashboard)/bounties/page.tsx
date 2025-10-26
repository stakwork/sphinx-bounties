"use client";

import { useState } from "react";
import { BountyCard } from "@/components/bounties/BountyCard";
import { useGetBounties } from "@/hooks/queries/use-bounty-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus } from "lucide-react";
import type { BountyStatus } from "@/types/enums";
import type { BountyListItem } from "@/types";
import Link from "next/link";

export default function BountiesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BountyStatus | "ALL">("ALL");

  const filters = {
    status: statusFilter === "ALL" ? undefined : statusFilter,
    search: search || undefined,
  };

  const { data, isLoading, error } = useGetBounties(filters);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bounties</h1>
          <p className="text-muted-foreground mt-1">Browse and claim open bounties</p>
        </div>
        <Link href="/bounties/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Bounty
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search bounties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as BountyStatus | "ALL")}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="ASSIGNED">Assigned</SelectItem>
            <SelectItem value="IN_REVIEW">In Review</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-lg border border-accent-200 bg-accent-50 p-4 text-accent-700">
          Failed to load bounties. Please try again.
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      )}

      {data && !isLoading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.data.map((bounty) => (
              <BountyCard key={bounty.id} bounty={bounty as BountyListItem} />
            ))}
          </div>

          {data.data.length === 0 && (
            <div className="text-center py-12">
              <p className="text-neutral-500">No bounties found. Try adjusting your filters.</p>
            </div>
          )}

          {data.pagination && data.pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <p className="text-sm text-neutral-600">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
