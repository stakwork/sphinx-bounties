"use client";

/**
 * ADMIN TRANSACTIONS MONITOR PAGE
 * Route: /admin/transactions
 *
 * Features:
 * - View all transactions across the platform
 * - Filter by type, status, date range
 * - Search by transaction ID, payment hash, bounty, user
 * - Sort by amount, date, status
 * - View transaction details
 * - Export data to CSV
 * - Monitor payment status
 *
 * API: Would use GET /api/admin/transactions (platform-wide)
 * Auth: Super admin only
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils/date";
import {
  Search,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  TrendingUp,
  DollarSign,
  Filter,
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const ITEMS_PER_PAGE = 20;

type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED" | "EXPIRED" | "ALL";
type SortField = "amount" | "createdAt" | "completedAt";

interface Transaction {
  id: string;
  bountyId: string;
  workspaceId: string;
  type: "PAYMENT";
  amount: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "EXPIRED";
  lightningInvoice: string | null;
  paymentHash: string | null;
  preimage: string | null;
  memo: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  fromUser: {
    pubkey: string;
    username: string;
  } | null;
  toUser: {
    pubkey: string;
    username: string;
    alias: string | null;
  } | null;
  bounty: {
    id: string;
    title: string;
  };
  workspace: {
    id: string;
    name: string;
  };
}

export default function AdminTransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TransactionStatus>("ALL");
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);

  // Mock data - in real app would fetch from API
  const isLoading = false;
  const error = null;

  // Generate mock transaction data
  const mockTransactions: Transaction[] = useMemo(() => {
    const statuses: Array<"PENDING" | "COMPLETED" | "FAILED" | "EXPIRED"> = [
      "PENDING",
      "COMPLETED",
      "FAILED",
      "EXPIRED",
    ];
    const transactions: Transaction[] = [];

    for (let i = 0; i < 50; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const createdDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const completedDate =
        status === "COMPLETED"
          ? new Date(createdDate.getTime() + Math.random() * 24 * 60 * 60 * 1000)
          : null;

      transactions.push({
        id: `tx_${i.toString().padStart(4, "0")}`,
        bountyId: `bounty_${Math.floor(Math.random() * 100)}`,
        workspaceId: `ws_${Math.floor(Math.random() * 20)}`,
        type: "PAYMENT",
        amount: (Math.random() * 1000000).toFixed(0),
        status,
        lightningInvoice:
          status !== "FAILED" ? `lnbc${Math.random().toString(36).substring(7)}` : null,
        paymentHash: status !== "FAILED" ? Math.random().toString(36).substring(2, 15) : null,
        preimage: status === "COMPLETED" ? Math.random().toString(36).substring(2, 15) : null,
        memo: `Payment for bounty completion #${i}`,
        errorMessage: status === "FAILED" ? "Insufficient balance" : null,
        createdAt: createdDate.toISOString(),
        completedAt: completedDate?.toISOString() || null,
        fromUser: {
          pubkey: `pubkey_from_${i}`,
          username: `workspace_owner_${i}`,
        },
        toUser: {
          pubkey: `pubkey_to_${i}`,
          username: `developer_${i}`,
          alias: `Dev ${i}`,
        },
        bounty: {
          id: `bounty_${i}`,
          title: `Implement feature #${i}`,
        },
        workspace: {
          id: `ws_${Math.floor(Math.random() * 20)}`,
          name: `Workspace ${Math.floor(Math.random() * 20)}`,
        },
      });
    }

    return transactions;
  }, []);

  // Filter, search, and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...mockTransactions];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tx) =>
          tx.id.toLowerCase().includes(query) ||
          tx.paymentHash?.toLowerCase().includes(query) ||
          tx.bounty.title.toLowerCase().includes(query) ||
          tx.workspace.name.toLowerCase().includes(query) ||
          tx.toUser?.username.toLowerCase().includes(query) ||
          tx.fromUser?.username.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((tx) => tx.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "amount") {
        comparison = parseInt(a.amount) - parseInt(b.amount);
      } else if (sortBy === "createdAt") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === "completedAt") {
        const aDate = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const bDate = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        comparison = aDate - bDate;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [mockTransactions, searchQuery, statusFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Calculate stats
  const stats = useMemo(() => {
    const total = mockTransactions.length;
    const pending = mockTransactions.filter((tx) => tx.status === "PENDING").length;
    const completed = mockTransactions.filter((tx) => tx.status === "COMPLETED").length;
    const failed = mockTransactions.filter((tx) => tx.status === "FAILED").length;
    const totalVolume = mockTransactions
      .filter((tx) => tx.status === "COMPLETED")
      .reduce((sum, tx) => sum + parseInt(tx.amount), 0);

    return { total, pending, completed, failed, totalVolume };
  }, [mockTransactions]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "ID",
      "Type",
      "Status",
      "Amount",
      "Bounty",
      "Workspace",
      "From",
      "To",
      "Payment Hash",
      "Created At",
      "Completed At",
    ];
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      tx.type,
      tx.status,
      tx.amount,
      tx.bounty.title,
      tx.workspace.name,
      tx.fromUser?.username || "-",
      tx.toUser?.username || "-",
      tx.paymentHash || "-",
      new Date(tx.createdAt).toISOString(),
      tx.completedAt ? new Date(tx.completedAt).toISOString() : "-",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "EXPIRED":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      COMPLETED: "default",
      PENDING: "secondary",
      FAILED: "destructive",
      EXPIRED: "outline",
    };
    return (
      <Badge variant={variants[status] || "secondary"} className="gap-1">
        {getStatusIcon(status)}
        {status}
      </Badge>
    );
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load transactions. Please try again later.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Transactions Monitor</h1>
        <p className="text-muted-foreground">Monitor all platform transactions and payments</p>
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
                <CardDescription>Total Transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
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
                <CardDescription>Failed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVolume.toLocaleString()}</div>
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
                  placeholder="Search by ID, hash, bounty, workspace, user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as TransactionStatus)}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortField)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date Created</SelectItem>
                <SelectItem value="completedAt">Date Completed</SelectItem>
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
              disabled={filteredTransactions.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions ({filteredTransactions.length})</CardTitle>
          <CardDescription>
            Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "ALL"
                  ? "Try adjusting your filters"
                  : "No transactions have been processed yet"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Bounty</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="font-mono text-sm">{tx.id}</div>
                        {tx.paymentHash && (
                          <div
                            className="text-xs text-muted-foreground truncate max-w-[120px]"
                            title={tx.paymentHash}
                          >
                            {tx.paymentHash}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Zap className="h-4 w-4 text-orange-500" />
                          <div>
                            <div className="font-medium">
                              {parseInt(tx.amount).toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">sats</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/bounties/${tx.bountyId}`}
                          className="text-sm hover:underline max-w-[200px] truncate block"
                          title={tx.bounty.title}
                        >
                          {tx.bounty.title}
                        </Link>
                        <div className="text-xs text-muted-foreground">{tx.workspace.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{tx.fromUser?.username || "-"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {tx.toUser?.alias || tx.toUser?.username || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(tx.createdAt)}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleTimeString()}
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
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/bounties/${tx.bountyId}`}>
                                <DollarSign className="mr-2 h-4 w-4" />
                                View Bounty
                              </Link>
                            </DropdownMenuItem>
                            {tx.status === "PENDING" && (
                              <DropdownMenuItem>
                                <TrendingUp className="mr-2 h-4 w-4" />
                                Retry Payment
                              </DropdownMenuItem>
                            )}
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
    </div>
  );
}
