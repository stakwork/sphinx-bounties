"use client";

import { useState } from "react";
import { WorkspaceCard, CreateWorkspaceModal } from "@/components/workspaces";
import { useGetWorkspaces } from "@/hooks/queries/use-workspace-queries";
import { useAuth } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Building2, AlertCircle } from "lucide-react";
import type { WorkspaceListItem } from "@/types";

export default function WorkspacesPage() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const limit = 12;

  const filters = {
    search: search || undefined,
  };

  const pagination = {
    page,
    limit,
  };

  const { data, isLoading, error } = useGetWorkspaces(filters, pagination);

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Workspaces</h1>
        <div className="text-center py-12 border border-dashed border-neutral-300 rounded-lg">
          <AlertCircle className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-600">Please log in to view your workspaces</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Workspaces</h1>
          <p className="text-neutral-600 mt-1">Manage your workspaces and teams</p>
        </div>
        <Button size="lg" className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-5 w-5" />
          Create Workspace
        </Button>
      </div>

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search workspaces..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to first page on search
            }}
            className="pl-10"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load workspaces. Please try again.</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      )}

      {/* Content */}
      {data && !isLoading && (
        <>
          {data.items.length === 0 && (
            <div className="text-center py-16 border border-dashed border-neutral-300 rounded-lg">
              <Building2 className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Workspaces Yet</h3>
              <p className="text-neutral-600 mb-6 max-w-sm mx-auto">
                {search
                  ? "No workspaces match your search. Try different keywords."
                  : "Get started by creating your first workspace to organize bounties and collaborate with your team."}
              </p>
              {!search && (
                <Button size="lg" className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-5 w-5" />
                  Create Your First Workspace
                </Button>
              )}
            </div>
          )}

          {data.items.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.items.map((workspace: WorkspaceListItem) => (
                  <WorkspaceCard key={workspace.id} workspace={workspace} />
                ))}
              </div>

              {/* Pagination */}
              {data.pagination && data.pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-neutral-600">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                    disabled={page === data.pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
