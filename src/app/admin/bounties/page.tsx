"use client";

/**
 * ADMIN BOUNTIES MANAGEMENT PAGE
 * Route: /admin/bounties
 *
 * Features:
 * - View all bounties across the platform
 * - Filter by status, workspace, creator, assignee
 * - Search by title, description
 * - Sort by amount, date created, date updated
 * - Admin actions: edit, delete, force status change
 * - Bulk actions: status changes, delete multiple
 * - Export data to CSV
 *
 * API: GET /api/bounties (all bounties)
 * Auth: Super admin only
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useGetBounties } from "@/hooks/queries/use-bounty-queries";
import { StatusBadge, AvatarWithFallback } from "@/components/common";
import type { BountyListItem } from "@/types/bounty";
import type { BountyStatus } from "@/types/enums";

const ITEMS_PER_PAGE = 20;

export default function AdminBountiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BountyStatus | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"amount" | "createdAt" | "updatedAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBounties, setSelectedBounties] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bountyToDelete, setBountyToDelete] = useState<string | null>(null);

  // Fetch all bounties
  const { data: bountiesData, isLoading, error } = useGetBounties();

  // Filter, search, and sort bounties
  const filteredBounties = useMemo(() => {
    if (!bountiesData?.bounties) return [];

    let filtered = [...bountiesData.bounties];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (bounty) =>
          bounty.title.toLowerCase().includes(query) ||
          bounty.description.toLowerCase().includes(query) ||
          bounty.workspace.name.toLowerCase().includes(query) ||
          bounty.creator.username.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((bounty) => bounty.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "amount") {
        comparison = a.amount - b.amount;
      } else if (sortBy === "createdAt") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === "updatedAt") {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [bountiesData?.bounties, searchQuery, statusFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredBounties.length / ITEMS_PER_PAGE);
  const paginatedBounties = filteredBounties.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Calculate stats
  const stats = useMemo(() => {
    if (!bountiesData?.bounties)
      return { total: 0, open: 0, assigned: 0, completed: 0, totalValue: 0 };

    return {
      total: bountiesData.bounties.length,
      open: bountiesData.bounties.filter((b: BountyListItem) => b.status === "OPEN").length,
      assigned: bountiesData.bounties.filter((b: BountyListItem) => b.status === "ASSIGNED").length,
      completed: bountiesData.bounties.filter(
        (b: BountyListItem) => b.status === "COMPLETED" || b.status === "PAID"
      ).length,
      totalValue: bountiesData.bounties.reduce(
        (sum: number, b: BountyListItem) => sum + b.amount,
        0
      ),
    };
  }, [bountiesData?.bounties]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedBounties.size === paginatedBounties.length) {
      setSelectedBounties(new Set());
    } else {
      setSelectedBounties(new Set(paginatedBounties.map((b) => b.id)));
    }
  };

  const toggleSelectBounty = (bountyId: string) => {
    const newSelected = new Set(selectedBounties);
    if (newSelected.has(bountyId)) {
      newSelected.delete(bountyId);
    } else {
      newSelected.add(bountyId);
    }
    setSelectedBounties(newSelected);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "ID",
      "Title",
      "Status",
      "Amount",
      "Workspace",
      "Creator",
      "Assignee",
      "Created At",
      "Updated At",
    ];
    const rows = filteredBounties.map((bounty) => [
      bounty.id,
      bounty.title,
      bounty.status,
      bounty.amount.toString(),
      bounty.workspace.name,
      bounty.creator.username,
      bounty.assignee?.username || "-",
      new Date(bounty.createdAt).toISOString(),
      new Date(bounty.updatedAt).toISOString(),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bounties-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Delete handler (placeholder - would call API)
  const handleDelete = () => {
    if (!bountyToDelete) return;
    // TODO: Call delete API endpoint
    // API call would go here: await deleteBounty(bountyToDelete)
    setDeleteDialogOpen(false);
    setBountyToDelete(null);
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load bounties. Please try again later.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Bounties Management</h1>
        <p className="text-muted-foreground">Manage all bounties across the platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5 mb-8">
        {isLoading ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Bounties</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Open</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Assigned</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.assigned}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Completed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Value</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalValue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">sats</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bounties by title, description, workspace, creator..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as BountyStatus | "ALL")}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date Created</SelectItem>
                <SelectItem value="updatedAt">Date Updated</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
            </Button>

            {/* Export */}
            <Button
              variant="outline"
              onClick={exportToCSV}
              disabled={filteredBounties.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedBounties.size > 0 && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">{selectedBounties.size} selected</span>
              <Button size="sm" variant="outline">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Bulk Approve
              </Button>
              <Button size="sm" variant="outline">
                <Clock className="mr-2 h-4 w-4" />
                Change Status
              </Button>
              <Button size="sm" variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bounties Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Bounties ({filteredBounties.length})</CardTitle>
          <CardDescription>
            Showing {paginatedBounties.length} of {filteredBounties.length} bounties
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredBounties.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bounties found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "ALL"
                  ? "Try adjusting your filters"
                  : "No bounties have been created yet"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          selectedBounties.size === paginatedBounties.length &&
                          paginatedBounties.length > 0
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Workspace</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBounties.map((bounty) => (
                    <TableRow key={bounty.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedBounties.has(bounty.id)}
                          onCheckedChange={() => toggleSelectBounty(bounty.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[300px]">
                          <div className="font-medium truncate">{bounty.title}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {bounty.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={bounty.status} size="sm" />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{bounty.amount.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">sats</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{bounty.workspace.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <AvatarWithFallback
                            src={bounty.creator.avatarUrl}
                            alt={bounty.creator.username}
                            size="sm"
                            className="h-6 w-6"
                          />
                          <span className="text-sm">
                            {bounty.creator.alias || bounty.creator.username}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {bounty.assignee ? (
                          <div className="flex items-center gap-2">
                            <AvatarWithFallback
                              src={bounty.assignee.avatarUrl}
                              alt={bounty.assignee.username}
                              size="sm"
                              className="h-6 w-6"
                            />
                            <span className="text-sm">
                              {bounty.assignee.alias || bounty.assignee.username}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(bounty.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(bounty.createdAt).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/bounties/${bounty.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Bounty
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setBountyToDelete(bounty.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bounty</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this bounty? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
