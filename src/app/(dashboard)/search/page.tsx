"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useGetBounties } from "@/hooks/queries/use-bounty-queries";
import { useGetWorkspaces } from "@/hooks/queries/use-workspace-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AvatarWithFallback } from "@/components/common";
import { Search as SearchIcon, Target, Briefcase, Filter, X, ArrowUpDown } from "lucide-react";
import { BountyStatus } from "@/types/enums";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "bounties");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (searchParams.get("sortOrder") as "asc" | "desc") || "desc"
  );
  const [page, setPage] = useState(1);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (activeTab !== "bounties") params.set("tab", activeTab);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (sortBy !== "createdAt") params.set("sortBy", sortBy);
      if (sortOrder !== "desc") params.set("sortOrder", sortOrder);

      router.push(`/search?${params.toString()}`, { scroll: false });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, statusFilter, sortBy, sortOrder, router]);

  const bountiesFilters = {
    search: searchQuery || undefined,
    status: statusFilter !== "all" ? (statusFilter as BountyStatus) : undefined,
  };

  const workspacesFilters = {
    search: searchQuery || undefined,
  };

  const { data: bountiesData, isLoading: bountiesLoading } = useGetBounties(
    bountiesFilters,
    { page, pageSize: 20 },
    { sortBy: sortBy as "createdAt", sortOrder }
  );

  const { data: workspacesData, isLoading: workspacesLoading } = useGetWorkspaces(
    workspacesFilters,
    { page, pageSize: 20 },
    { sortBy: sortBy as "createdAt", sortOrder }
  );

  const bounties = bountiesData?.data || [];
  const workspaces = workspacesData?.data || [];
  const bountiesPagination = bountiesData?.pagination;
  const workspacesPagination = workspacesData?.pagination;

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Search</h1>
        <p className="text-neutral-600">Find bounties, workspaces, and more</p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                type="text"
                placeholder="Search for bounties, workspaces..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            {searchQuery && (
              <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
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

            {activeTab === "bounties" && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={BountyStatus.OPEN}>Open</SelectItem>
                  <SelectItem value={BountyStatus.ASSIGNED}>Assigned</SelectItem>
                  <SelectItem value={BountyStatus.IN_REVIEW}>In Review</SelectItem>
                  <SelectItem value={BountyStatus.COMPLETED}>Completed</SelectItem>
                  <SelectItem value={BountyStatus.PAID}>Paid</SelectItem>
                </SelectContent>
              </Select>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <ArrowUpDown className="h-4 w-4 text-neutral-400" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "asc" | "desc")}>
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
                Clear All Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="bounties" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Bounties
            {bounties.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {bountiesPagination?.totalCount || 0}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="workspaces" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Workspaces
            {workspaces.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {workspacesPagination?.totalCount || 0}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Bounties Tab */}
        <TabsContent value="bounties" className="space-y-4">
          {bountiesLoading && (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          )}

          {!bountiesLoading && bounties.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No bounties found</h3>
                <p className="text-neutral-600 mb-4">
                  {searchQuery
                    ? `No bounties match "${searchQuery}"`
                    : "Try adjusting your filters"}
                </p>
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}

          {!bountiesLoading && bounties.length > 0 && (
            <>
              <div className="space-y-4">
                \n{" "}
                {bounties.map((bounty: any) => (
                  <Link key={bounty.id} href={`/bounties/${bounty.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold truncate">{bounty.title}</h3>
                              <Badge variant={bounty.status === "OPEN" ? "default" : "secondary"}>
                                {bounty.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-neutral-600 line-clamp-2 mb-3">
                              {bounty.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
                              {bounty.workspace && (
                                <div className="flex items-center gap-1">
                                  <Briefcase className="h-4 w-4" />
                                  <span>{bounty.workspace.name}</span>
                                </div>
                              )}
                              {bounty.creator && (
                                <div className="flex items-center gap-1">
                                  <AvatarWithFallback
                                    src={bounty.creator.avatarUrl}
                                    alt={bounty.creator.alias || bounty.creator.username}
                                    size="sm"
                                  />
                                  <span>{bounty.creator.alias || bounty.creator.username}</span>
                                </div>
                              )}
                              {bounty.codingLanguages && bounty.codingLanguages.length > 0 && (
                                <div className="flex gap-1">
                                  {bounty.codingLanguages.slice(0, 3).map((lang: string) => (
                                    <Badge key={lang} variant="outline" className="text-xs">
                                      {lang}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary-600">
                              {bounty.amount.toLocaleString()}
                            </p>
                            <p className="text-xs text-neutral-600">sats</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {bountiesPagination && bountiesPagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-600">
                    Showing {(page - 1) * 20 + 1} -{" "}
                    {Math.min(page * 20, bountiesPagination.totalCount)} of{" "}
                    {bountiesPagination.totalCount}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-neutral-600">
                      Page {page} of {bountiesPagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(bountiesPagination.totalPages, p + 1))}
                      disabled={page === bountiesPagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Workspaces Tab */}
        <TabsContent value="workspaces" className="space-y-4">
          {workspacesLoading && (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          )}

          {!workspacesLoading && workspaces.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No workspaces found</h3>
                <p className="text-neutral-600 mb-4">
                  {searchQuery
                    ? `No workspaces match "${searchQuery}"`
                    : "Try adjusting your search"}
                </p>
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Search
                </Button>
              </CardContent>
            </Card>
          )}

          {!workspacesLoading && workspaces.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                \n{" "}
                {workspaces.map((workspace: any) => (
                  <Link key={workspace.id} href={`/workspaces/${workspace.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <AvatarWithFallback
                            src={workspace.avatarUrl}
                            alt={workspace.name}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <CardTitle className="truncate">{workspace.name}</CardTitle>
                            {workspace.description && (
                              <p className="text-sm text-neutral-600 line-clamp-2 mt-1">
                                {workspace.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            <span>{workspace.bountiesCount || 0} bounties</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>👥</span>
                            <span>{workspace.membersCount || 0} members</span>
                          </div>
                          {workspace.budget && (
                            <div className="flex items-center gap-1">
                              <span>💰</span>
                              <span>{workspace.budget.amount.toLocaleString()} sats</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {workspacesPagination && workspacesPagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-600">
                    Showing {(page - 1) * 20 + 1} -{" "}
                    {Math.min(page * 20, workspacesPagination.totalCount)} of{" "}
                    {workspacesPagination.totalCount}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-neutral-600">
                      Page {page} of {workspacesPagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(workspacesPagination.totalPages, p + 1))
                      }
                      disabled={page === workspacesPagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
