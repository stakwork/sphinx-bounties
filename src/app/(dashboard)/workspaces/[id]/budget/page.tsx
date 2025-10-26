"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  useGetWorkspace,
  useGetWorkspaceBudget,
  useGetWorkspaceTransactions,
} from "@/hooks/queries/use-workspace-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/common";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Filter,
} from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: string;
  fromUserPubkey: string | null;
  toUserPubkey: string | null;
  status: string;
  memo: string | null;
  createdAt: string;
  completedAt: string | null;
  bounty: {
    id: string;
    title: string;
  } | null;
  fromUser: {
    pubkey: string;
    username: string;
    alias: string | null;
  } | null;
  toUser: {
    pubkey: string;
    username: string;
    alias: string | null;
  } | null;
}

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  PAYMENT: "Payment",
  DEPOSIT: "Deposit",
  WITHDRAWAL: "Withdrawal",
  REFUND: "Refund",
  FEE: "Fee",
};

const TRANSACTION_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  EXPIRED: "bg-neutral-100 text-neutral-800",
};

export default function WorkspaceBudgetPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const workspaceId = params.id;

  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspace(workspaceId);
  const { data: budget, isLoading: budgetLoading } = useGetWorkspaceBudget(workspaceId);
  const { data: transactionsData, isLoading: transactionsLoading } = useGetWorkspaceTransactions(
    workspaceId,
    { page, pageSize: 20 },
    typeFilter === "all" ? undefined : typeFilter
  );

  const isAdmin = workspace?.role === "OWNER" || workspace?.role === "ADMIN";

  const totalBudget = budget ? parseInt(budget.totalBudget) : 0;
  const availableBudget = budget ? parseInt(budget.availableBudget) : 0;
  const reservedBudget = budget ? parseInt(budget.reservedBudget) : 0;
  const paidBudget = budget ? parseInt(budget.paidBudget) : 0;

  const transactions = transactionsData?.transactions || [];
  const pagination = transactionsData?.pagination;

  if (workspaceLoading || budgetLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
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
          <h1 className="text-3xl font-bold">{workspace.name} - Budget</h1>
          <p className="text-neutral-600 mt-1">Manage workspace funds and view transactions</p>
        </div>
        {isAdmin && (
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Funds
          </Button>
        )}
      </div>

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Total Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CurrencyDisplay amount={totalBudget} size="lg" className="text-2xl" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CurrencyDisplay
              amount={availableBudget}
              size="lg"
              className="text-2xl text-green-600"
            />
            <p className="text-xs text-neutral-500 mt-1">
              {totalBudget > 0 ? Math.round((availableBudget / totalBudget) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              Reserved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CurrencyDisplay
              amount={reservedBudget}
              size="lg"
              className="text-2xl text-yellow-600"
            />
            <p className="text-xs text-neutral-500 mt-1">For active bounties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-blue-600" />
              Paid Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CurrencyDisplay amount={paidBudget} size="lg" className="text-2xl text-blue-600" />
            <p className="text-xs text-neutral-500 mt-1">
              {totalBudget > 0 ? Math.round((paidBudget / totalBudget) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Allocation Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Available</span>
                <span className="font-semibold">
                  {totalBudget > 0 ? Math.round((availableBudget / totalBudget) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{
                    width: `${totalBudget > 0 ? (availableBudget / totalBudget) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Reserved</span>
                <span className="font-semibold">
                  {totalBudget > 0 ? Math.round((reservedBudget / totalBudget) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 transition-all"
                  style={{
                    width: `${totalBudget > 0 ? (reservedBudget / totalBudget) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Paid Out</span>
                <span className="font-semibold">
                  {totalBudget > 0 ? Math.round((paidBudget / totalBudget) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${totalBudget > 0 ? (paidBudget / totalBudget) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction History</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-neutral-400" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="PAYMENT">Payments</SelectItem>
                  <SelectItem value="DEPOSIT">Deposits</SelectItem>
                  <SelectItem value="WITHDRAWAL">Withdrawals</SelectItem>
                  <SelectItem value="REFUND">Refunds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transactionsLoading && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          )}

          {!transactionsLoading && transactions.length === 0 && (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Transactions</h3>
              <p className="text-neutral-600">No transactions found for this workspace yet.</p>
            </div>
          )}

          {!transactionsLoading && transactions.length > 0 && (
            <div className="space-y-3">
              {transactions.map((transaction: Transaction) => {
                const isIncoming = transaction.toUserPubkey !== null;
                const statusColor =
                  TRANSACTION_STATUS_COLORS[transaction.status] ||
                  "bg-neutral-100 text-neutral-800";

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-full ${isIncoming ? "bg-green-100" : "bg-red-100"}`}
                      >
                        {isIncoming ? (
                          <ArrowDownRight className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {TRANSACTION_TYPE_LABELS[transaction.type] || transaction.type}
                          </p>
                          <Badge variant="secondary" className={`text-xs ${statusColor}`}>
                            {transaction.status}
                          </Badge>
                        </div>
                        {transaction.bounty && (
                          <Link
                            href={`/bounties/${transaction.bounty.id}`}
                            className="text-sm text-primary-600 hover:underline"
                          >
                            {transaction.bounty.title}
                          </Link>
                        )}
                        {transaction.memo && (
                          <p className="text-sm text-neutral-600">{transaction.memo}</p>
                        )}
                        <p className="text-xs text-neutral-500 mt-1">
                          {new Date(transaction.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <CurrencyDisplay
                        amount={parseInt(transaction.amount)}
                        size="md"
                        className={`font-semibold ${
                          isIncoming ? "text-green-600" : "text-red-600"
                        }`}
                      />
                      {transaction.toUser && (
                        <p className="text-xs text-neutral-500 mt-1">
                          To: {transaction.toUser.alias || transaction.toUser.username}
                        </p>
                      )}
                      {transaction.fromUser && (
                        <p className="text-xs text-neutral-500 mt-1">
                          From: {transaction.fromUser.alias || transaction.fromUser.username}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-neutral-200">
              <p className="text-sm text-neutral-600">
                Showing {(pagination.page - 1) * pagination.perPage + 1} -{" "}
                {Math.min(pagination.page * pagination.perPage, pagination.total)} of{" "}
                {pagination.total} transactions
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
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
