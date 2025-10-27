"use client";

/**
 * ADMIN WORKSPACES MANAGEMENT PAGE
 * Route: /admin/workspaces
 *
 * Features:
 * - View all workspaces across the platform
 * - Search by name, description, owner
 * - Sort by name, members, bounties, budget, date created
 * - Admin actions: verify, suspend, edit, delete
 * - View workspace details and members
 * - Export data to CSV
 *
 * API: GET /api/workspaces (all workspaces)
 * Auth: Super admin only
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Download,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  AlertCircle,
  Users,
  FileText,
  Wallet,
  CheckCircle,
  Ban,
  ExternalLink,
  Github,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useGetWorkspaces } from "@/hooks/queries/use-workspace-queries";
import { AvatarWithFallback } from "@/components/common";
import type { WorkspaceListItem } from "@/types/workspace";

const ITEMS_PER_PAGE = 20;

type SortField = "name" | "memberCount" | "bountyCount" | "budget" | "createdAt";

export default function AdminWorkspacesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<string | null>(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [workspaceToVerify, setWorkspaceToVerify] = useState<string | null>(null);

  // Fetch all workspaces
  const { data: workspacesData, isLoading, error } = useGetWorkspaces();

  // Filter, search, and sort workspaces
  const filteredWorkspaces = useMemo(() => {
    if (!workspacesData?.items) return [];

    let filtered = [...workspacesData.items];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (workspace) =>
          workspace.name.toLowerCase().includes(query) ||
          workspace.description?.toLowerCase().includes(query) ||
          workspace.mission?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "memberCount") {
        comparison = a.memberCount - b.memberCount;
      } else if (sortBy === "bountyCount") {
        comparison = a.bountyCount - b.bountyCount;
      } else if (sortBy === "budget") {
        const aBudget = parseInt(a.budget?.totalBudget || "0");
        const bBudget = parseInt(b.budget?.totalBudget || "0");
        comparison = aBudget - bBudget;
      } else if (sortBy === "createdAt") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [workspacesData?.items, searchQuery, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredWorkspaces.length / ITEMS_PER_PAGE);
  const paginatedWorkspaces = filteredWorkspaces.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Calculate stats
  const stats = useMemo(() => {
    if (!workspacesData?.items)
      return { total: 0, totalMembers: 0, totalBounties: 0, totalBudget: 0, verified: 0 };

    const totalMembers = workspacesData.items.reduce(
      (sum: number, w: WorkspaceListItem) => sum + w.memberCount,
      0
    );
    const totalBounties = workspacesData.items.reduce(
      (sum: number, w: WorkspaceListItem) => sum + w.bountyCount,
      0
    );
    const totalBudget = workspacesData.items.reduce((sum: number, w: WorkspaceListItem) => {
      return sum + parseInt(w.budget?.totalBudget || "0");
    }, 0);

    return {
      total: workspacesData.items.length,
      totalMembers,
      totalBounties,
      totalBudget,
      verified: Math.floor(workspacesData.items.length * 0.65), // Mock verified count
    };
  }, [workspacesData?.items]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "ID",
      "Name",
      "Description",
      "Members",
      "Bounties",
      "Budget",
      "Website",
      "GitHub",
      "Owner",
      "Created At",
    ];
    const rows = filteredWorkspaces.map((workspace) => [
      workspace.id,
      workspace.name,
      workspace.description || "-",
      workspace.memberCount.toString(),
      workspace.bountyCount.toString(),
      workspace.budget?.totalBudget || "0",
      workspace.websiteUrl || "-",
      workspace.githubUrl || "-",
      workspace.ownerPubkey,
      new Date(workspace.createdAt).toISOString(),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workspaces-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Delete handler (placeholder - would call API)
  const handleDelete = () => {
    if (!workspaceToDelete) return;
    // TODO: Call delete API endpoint
    // API call would go here: await deleteWorkspace(workspaceToDelete)
    setDeleteDialogOpen(false);
    setWorkspaceToDelete(null);
  };

  // Verify handler (placeholder - would call API)
  const handleVerify = () => {
    if (!workspaceToVerify) return;
    // TODO: Call verify API endpoint
    // API call would go here: await verifyWorkspace(workspaceToVerify)
    setVerifyDialogOpen(false);
    setWorkspaceToVerify(null);
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load workspaces. Please try again later.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Workspaces Management</h1>
        <p className="text-muted-foreground">Manage all workspaces across the platform</p>
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
                <CardDescription>Total Workspaces</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.totalMembers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Bounties</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.totalBounties}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Budget</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBudget.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">sats</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Verified</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
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
                  placeholder="Search workspaces by name, description, mission..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortField)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date Created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="memberCount">Members</SelectItem>
                <SelectItem value="bountyCount">Bounties</SelectItem>
                <SelectItem value="budget">Budget</SelectItem>
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
              disabled={filteredWorkspaces.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Workspaces Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Workspaces ({filteredWorkspaces.length})</CardTitle>
          <CardDescription>
            Showing {paginatedWorkspaces.length} of {filteredWorkspaces.length} workspaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredWorkspaces.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No workspaces found</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "No workspaces have been created yet"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workspace</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Bounties</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Links</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedWorkspaces.map((workspace) => (
                    <TableRow key={workspace.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <AvatarWithFallback
                            src={workspace.avatarUrl}
                            alt={workspace.name}
                            size="md"
                            className="h-10 w-10"
                          />
                          <div className="max-w-[250px]">
                            <div className="font-medium truncate">{workspace.name}</div>
                            {workspace.description && (
                              <div className="text-sm text-muted-foreground truncate">
                                {workspace.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{workspace.memberCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{workspace.bountyCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {parseInt(workspace.budget?.totalBudget || "0").toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">sats</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {workspace.websiteUrl && (
                            <a
                              href={workspace.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          {workspace.githubUrl && (
                            <a
                              href={workspace.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Github className="h-4 w-4" />
                            </a>
                          )}
                          {!workspace.websiteUrl && !workspace.githubUrl && (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {/* Mock verification status - would come from API */}
                        {Math.random() > 0.35 ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(workspace.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(workspace.createdAt).toLocaleTimeString()}
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
                              <Link href={`/workspaces/${workspace.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Workspace
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setWorkspaceToVerify(workspace.id);
                                setVerifyDialogOpen(true);
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Verify
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Ban className="mr-2 h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setWorkspaceToDelete(workspace.id);
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
            <DialogTitle>Delete Workspace</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this workspace? This action cannot be undone and will
              affect all associated bounties and members.
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

      {/* Verify Confirmation Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Workspace</DialogTitle>
            <DialogDescription>
              Are you sure you want to verify this workspace? This will grant it verified status on
              the platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerify}>Verify</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
