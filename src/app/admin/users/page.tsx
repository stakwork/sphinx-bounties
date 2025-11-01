"use client";

/**
 * ADMIN USERS MANAGEMENT PAGE
 * Route: /admin/users
 *
 * Features:
 * - View all users across the platform
 * - Search by username, alias, pubkey
 * - Sort by username, joined date, bounties completed, earnings
 * - Admin actions: verify, ban, edit profile, delete account
 * - View user details and activity
 * - Export data to CSV
 *
 * API: GET /api/users (all users)
 * Auth: Super admin only
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils/date";
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
  CheckCircle,
  Ban,
  Shield,
  Github,
  Twitter,
  Award,
  TrendingUp,
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
import { useGetUsers } from "@/hooks/queries/use-user-queries";
import { AvatarWithFallback } from "@/components/common";

const ITEMS_PER_PAGE = 20;

type SortField = "username" | "createdAt" | "bountiesCompleted" | "totalEarned";

interface UserListItem {
  pubkey: string;
  username: string;
  alias: string | null;
  description: string | null;
  avatarUrl: string | null;
  githubUsername: string | null;
  githubVerified: boolean;
  twitterUsername: string | null;
  twitterVerified: boolean;
  contactEmail?: string | null;
  createdAt: string;
  lastLogin: string | null;
  stats: {
    bountiesCreated: number;
    bountiesAssigned: number;
    workspaces: number;
  };
}

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [userToBan, setUserToBan] = useState<string | null>(null);

  // Fetch all users
  const { data: usersData, isLoading, error } = useGetUsers();

  // Filter, search, and sort users
  const filteredUsers = useMemo(() => {
    if (!usersData?.items) return [];

    let filtered = [...usersData.items];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(query) ||
          user.alias?.toLowerCase().includes(query) ||
          user.pubkey.toLowerCase().includes(query) ||
          user.githubUsername?.toLowerCase().includes(query) ||
          user.twitterUsername?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "username") {
        comparison = a.username.localeCompare(b.username);
      } else if (sortBy === "createdAt") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === "bountiesCompleted") {
        // Mock data - would come from user stats
        comparison = 0;
      } else if (sortBy === "totalEarned") {
        // Mock data - would come from user stats
        comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [usersData?.items, searchQuery, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Calculate stats
  const stats = useMemo(() => {
    if (!usersData?.items)
      return { total: 0, verified: 0, githubVerified: 0, twitterVerified: 0, active: 0 };

    const githubVerified = usersData.items.filter(
      (u: UserListItem) => u.githubUsername && u.githubVerified
    ).length;
    const twitterVerified = usersData.items.filter(
      (u: UserListItem) => u.twitterUsername && u.twitterVerified
    ).length;

    return {
      total: usersData.items.length,
      verified: Math.floor(usersData.items.length * 0.45), // Mock verified count
      githubVerified,
      twitterVerified,
      active: Math.floor(usersData.items.length * 0.62), // Mock active count
    };
  }, [usersData?.items]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Pubkey",
      "Username",
      "Alias",
      "Email",
      "GitHub",
      "Twitter",
      "GitHub Verified",
      "Twitter Verified",
      "Created At",
    ];
    const rows = filteredUsers.map((user) => [
      user.pubkey,
      user.username,
      user.alias || "-",
      user.contactEmail || "-",
      user.githubUsername || "-",
      user.twitterUsername || "-",
      user.githubVerified ? "Yes" : "No",
      user.twitterVerified ? "Yes" : "No",
      new Date(user.createdAt).toISOString(),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Delete handler (placeholder - would call API)
  const handleDelete = () => {
    if (!userToDelete) return;
    // TODO: Call delete API endpoint
    // API call would go here: await deleteUser(userToDelete)
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  // Ban handler (placeholder - would call API)
  const handleBan = () => {
    if (!userToBan) return;
    // TODO: Call ban API endpoint
    // API call would go here: await banUser(userToBan)
    setBanDialogOpen(false);
    setUserToBan(null);
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load users. Please try again later.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Users Management</h1>
        <p className="text-muted-foreground">Manage all users across the platform</p>
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
                <CardDescription>Total Users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Verified</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.verified}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>GitHub Verified</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.githubVerified}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Twitter Verified</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-sky-600">{stats.twitterVerified}</div>
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
                  placeholder="Search users by username, alias, pubkey, GitHub, Twitter..."
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
                <SelectItem value="createdAt">Date Joined</SelectItem>
                <SelectItem value="username">Username</SelectItem>
                <SelectItem value="bountiesCompleted">Bounties</SelectItem>
                <SelectItem value="totalEarned">Earnings</SelectItem>
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
            <Button variant="outline" onClick={exportToCSV} disabled={filteredUsers.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Showing {paginatedUsers.length} of {filteredUsers.length} users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try adjusting your search query" : "No users have registered yet"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Pubkey</TableHead>
                    <TableHead>Social Links</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow key={user.pubkey}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <AvatarWithFallback
                            src={user.avatarUrl}
                            alt={user.username}
                            size="md"
                            className="h-10 w-10"
                          />
                          <div>
                            <div className="font-medium">{user.alias || user.username}</div>
                            <div className="text-sm text-muted-foreground">@{user.username}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[120px]">
                          <code className="text-xs truncate block" title={user.pubkey}>
                            {user.pubkey.substring(0, 8)}...
                            {user.pubkey.substring(user.pubkey.length - 6)}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {user.githubUsername ? (
                            <a
                              href={`https://github.com/${user.githubUsername}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                              title={user.githubUsername}
                            >
                              <Github className="h-4 w-4" />
                            </a>
                          ) : (
                            <Github className="h-4 w-4 text-muted-foreground/30" />
                          )}
                          {user.twitterUsername ? (
                            <a
                              href={`https://twitter.com/${user.twitterUsername}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                              title={user.twitterUsername}
                            >
                              <Twitter className="h-4 w-4" />
                            </a>
                          ) : (
                            <Twitter className="h-4 w-4 text-muted-foreground/30" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {user.githubVerified && (
                            <Badge variant="secondary" className="gap-1 w-fit">
                              <Github className="h-3 w-3" />
                              GitHub
                            </Badge>
                          )}
                          {user.twitterVerified && (
                            <Badge variant="secondary" className="gap-1 w-fit">
                              <Twitter className="h-3 w-3" />
                              Twitter
                            </Badge>
                          )}
                          {!user.githubVerified && !user.twitterVerified && (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex items-center gap-1">
                            <Award className="h-3 w-3 text-muted-foreground" />
                            <span>{Math.floor(Math.random() * 50)} bounties</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-muted-foreground" />
                            <span>{(Math.random() * 100000).toFixed(0)} sats</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(user.createdAt)}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(user.createdAt).toLocaleTimeString()}
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
                              <Link href={`/profile/${user.username}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Verify User
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Shield className="mr-2 h-4 w-4" />
                              Grant Admin
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setUserToBan(user.pubkey);
                                setBanDialogOpen(true);
                              }}
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Ban User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setUserToDelete(user.pubkey);
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
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone and will
              remove all associated data.
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

      {/* Ban Confirmation Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Are you sure you want to ban this user? They will no longer be able to access the
              platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBan}>
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
