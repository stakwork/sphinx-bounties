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
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import type { BountyStatus } from "@/types/enums";
import type { BountyListItem } from "@/types";
import Link from "next/link";

export default function BountiesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BountyStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const limit = 12;

  const filters = {
    status: statusFilter === "ALL" ? undefined : statusFilter,
    search: search || undefined,
  };

  const pagination = {
    page,
    limit,
  };

  const { data: response, isLoading, error } = useGetBounties(filters, pagination);

  const bounties = response?.data || [];
  const paginationMeta = response?.meta?.pagination;

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
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
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

      {!isLoading && (
        <>
          {bounties.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bounties.map((bounty: BountyListItem) => (
                <BountyCard key={bounty.id} bounty={bounty} />
              ))}
            </div>
          )}

          {bounties.length === 0 && (
            <div className="text-center py-12 text-neutral-500">
              No bounties found. Try adjusting your filters.
            </div>
          )}

          {paginationMeta && paginationMeta.totalPages > 1 && (
            <div className="flex flex-col items-center gap-4 pt-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {/* First page */}
                  {page > 3 && (
                    <>
                      <Button
                        variant={page === 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(1)}
                        className="w-10"
                      >
                        1
                      </Button>
                      {page > 4 && <span className="px-2 text-neutral-500">...</span>}
                    </>
                  )}

                  {/* Pages around current page */}
                  {Array.from({ length: paginationMeta.totalPages }, (_, i) => i + 1)
                    .filter((p) => p >= page - 2 && p <= page + 2)
                    .map((p) => (
                      <Button
                        key={p}
                        variant={page === p ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(p)}
                        className="w-10"
                      >
                        {p}
                      </Button>
                    ))}

                  {/* Last page */}
                  {page < paginationMeta.totalPages - 2 && (
                    <>
                      {page < paginationMeta.totalPages - 3 && (
                        <span className="text-neutral-500">...</span>
                      )}
                      <Button
                        variant={page === paginationMeta.totalPages ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(paginationMeta.totalPages)}
                        className="w-10"
                      >
                        {paginationMeta.totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(paginationMeta.totalPages, p + 1))}
                  disabled={page === paginationMeta.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <p className="text-sm text-neutral-600">
                Page {paginationMeta.page} of {paginationMeta.totalPages} (
                {paginationMeta.totalCount} total bounties)
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
