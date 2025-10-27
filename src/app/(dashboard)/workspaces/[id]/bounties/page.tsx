"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useGetWorkspace } from "@/hooks/queries/use-workspace-queries";
import { useGetBountiesByWorkspace } from "@/hooks/queries/use-bounty-queries";
import { BountyCard } from "@/components/bounties/BountyCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Search,
  Target,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { BountyStatus } from "@/types/enums";
import type { BountyListItem } from "@/types";

export default function WorkspaceBountiesPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const workspaceId = params.id;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BountyStatus | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"createdAt" | "amount" | "updatedAt" | "deadline">(
    "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspace(workspaceId);

  const filters = {
    status: statusFilter === "ALL" ? undefined : statusFilter,
    search: search || undefined,
  };

  const sort = {
    sortBy,
    sortOrder,
  };

  const { data, isLoading: bountiesLoading } = useGetBountiesByWorkspace(
    workspaceId,
    { page, pageSize },
    sort
  );

  const isAdmin = workspace?.role === "OWNER" || workspace?.role === "ADMIN";

  // Filter bounties client-side (since API might not support all filters)
  const filteredBounties =
    data?.data?.filter((bounty: BountyListItem) => {
      if (filters.status && bounty.status !== filters.status) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          bounty.title.toLowerCase().includes(searchLower) ||
          bounty.description?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    }) || [];

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  const hasActiveFilters = search || statusFilter !== "ALL";

  if (workspaceLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Workspace Not Found</h3>
        <p className="text-neutral-600 mb-4">
          This workspace doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Link href="/workspaces">
          <Button variant="outline">Back to Workspaces</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{workspace.name} - Bounties</h1>
          <p className="text-neutral-600 mt-1">
            {data?.pagination?.totalCount || 0} total bounties in this workspace
          </p>
        </div>
        {isAdmin && (
          <Link href={`/bounties/new?workspace=${workspaceId}`}>
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Bounty
            </Button>
          </Link>
        )}
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search bounties by title or description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filters & Sort */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-neutral-400" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as BountyStatus | "ALL");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value={BountyStatus.DRAFT}>Draft</SelectItem>
                <SelectItem value={BountyStatus.OPEN}>Open</SelectItem>
                <SelectItem value={BountyStatus.ASSIGNED}>Assigned</SelectItem>
                <SelectItem value={BountyStatus.IN_REVIEW}>In Review</SelectItem>
                <SelectItem value={BountyStatus.COMPLETED}>Completed</SelectItem>
                <SelectItem value={BountyStatus.PAID}>Paid</SelectItem>
                <SelectItem value={BountyStatus.CANCELLED}>Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 ml-auto">
              <ArrowUpDown className="h-4 w-4 text-neutral-400" />
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="updatedAt">Updated Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as typeof sortOrder)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      {data?.data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Target className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {data.data.filter((b: BountyListItem) => b.status === BountyStatus.OPEN).length}
                </p>
                <p className="text-xs text-neutral-600">Open</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {
                    data.data.filter((b: BountyListItem) => b.status === BountyStatus.ASSIGNED)
                      .length
                  }
                </p>
                <p className="text-xs text-neutral-600">Assigned</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Target className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {
                    data.data.filter((b: BountyListItem) => b.status === BountyStatus.IN_REVIEW)
                      .length
                  }
                </p>
                <p className="text-xs text-neutral-600">In Review</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Target className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {
                    data.data.filter(
                      (b: BountyListItem) =>
                        b.status === BountyStatus.COMPLETED || b.status === BountyStatus.PAID
                    ).length
                  }
                </p>
                <p className="text-xs text-neutral-600">Completed</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bounties Grid */}
      {bountiesLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      )}

      {!bountiesLoading && filteredBounties.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Target className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {hasActiveFilters ? "No bounties match your filters" : "No bounties yet"}
            </h3>
            <p className="text-neutral-600 mb-6">
              {hasActiveFilters
                ? "Try adjusting your search or filters to find what you're looking for"
                : isAdmin
                  ? "Create your first bounty to get started"
                  : "This workspace doesn't have any bounties yet"}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            ) : isAdmin ? (
              <Link href={`/bounties/new?workspace=${workspaceId}`}>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Bounty
                </Button>
              </Link>
            ) : null}
          </CardContent>
        </Card>
      )}

      {!bountiesLoading && filteredBounties.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBounties.map((bounty: BountyListItem) => (
              <BountyCard key={bounty.id} bounty={bounty} />
            ))}
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <Card>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-neutral-600">
                    Showing {(page - 1) * pageSize + 1} -{" "}
                    {Math.min(page * pageSize, data.pagination.totalCount)} of{" "}
                    {data.pagination.totalCount} bounties
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
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
                      {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1)
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
                      {page < data.pagination.totalPages - 2 && (
                        <>
                          {page < data.pagination.totalPages - 3 && (
                            <span className="px-2 text-neutral-500">...</span>
                          )}
                          <Button
                            variant={page === data.pagination.totalPages ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(data.pagination.totalPages)}
                            className="w-10"
                          >
                            {data.pagination.totalPages}
                          </Button>
                        </>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                      disabled={page === data.pagination.totalPages}
                      className="gap-2"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Quick Stats Footer */}
      {!bountiesLoading && filteredBounties.length > 0 && (
        <Card className="bg-gradient-to-br from-primary-50 to-secondary-50 border-primary-100">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="text-sm text-neutral-600 mb-1">Total Bounty Value</p>
                <p className="text-3xl font-bold text-primary-600">
                  {filteredBounties
                    .reduce((sum: number, b: BountyListItem) => sum + b.amount, 0)
                    .toLocaleString()}{" "}
                  <span className="text-lg">sats</span>
                </p>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <Badge variant="secondary" className="mb-1">
                    Avg Bounty
                  </Badge>
                  <p className="text-xl font-semibold">
                    {Math.round(
                      filteredBounties.reduce(
                        (sum: number, b: BountyListItem) => sum + b.amount,
                        0
                      ) / filteredBounties.length
                    ).toLocaleString()}{" "}
                    sats
                  </p>
                </div>
                <div className="text-center">
                  <Badge variant="secondary" className="mb-1">
                    Highest
                  </Badge>
                  <p className="text-xl font-semibold">
                    {Math.max(
                      ...filteredBounties.map((b: BountyListItem) => b.amount)
                    ).toLocaleString()}{" "}
                    sats
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
