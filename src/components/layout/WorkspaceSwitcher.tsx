"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AvatarWithFallback } from "@/components/common";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateWorkspaceModal } from "@/components/workspaces";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useGetWorkspacesByMember } from "@/hooks/queries/use-workspace-queries";
import type { WorkspaceListItem } from "@/types/workspace";

const STORAGE_KEY = "sphinx-selected-workspace";

export function WorkspaceSwitcher() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);

  const { data: workspacesData, isLoading } = useGetWorkspacesByMember(
    user?.pubkey || "",
    undefined,
    { sortBy: "name", sortOrder: "asc" }
  );

  const workspaces = useMemo(() => workspacesData?.workspaces || [], [workspacesData?.workspaces]);

  const selectedWorkspace = useMemo(
    () => workspaces.find((w: WorkspaceListItem) => w.id === selectedWorkspaceId),
    [workspaces, selectedWorkspaceId]
  );

  useEffect(() => {
    if (!isAuthenticated || workspaces.length === 0) return;

    const urlWorkspaceId = searchParams.get("workspace");
    const storedWorkspaceId = localStorage.getItem(STORAGE_KEY);

    const workspaceToSelect =
      (urlWorkspaceId && workspaces.find((w: WorkspaceListItem) => w.id === urlWorkspaceId)) ||
      (storedWorkspaceId &&
        workspaces.find((w: WorkspaceListItem) => w.id === storedWorkspaceId)) ||
      workspaces[0];

    if (workspaceToSelect) {
      setSelectedWorkspaceId(workspaceToSelect.id);
      if (!urlWorkspaceId) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("workspace", workspaceToSelect.id);
        router.replace(`?${params.toString()}`, { scroll: false });
      }
    }
  }, [isAuthenticated, workspaces, searchParams, router]);

  const handleWorkspaceSelect = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    localStorage.setItem(STORAGE_KEY, workspaceId);

    const params = new URLSearchParams(searchParams.toString());
    params.set("workspace", workspaceId);
    router.replace(`?${params.toString()}`, { scroll: false });

    setOpen(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return <Skeleton className="h-10 w-[200px]" />;
  }

  if (workspaces.length === 0) {
    return (
      <>
        <Button
          variant="outline"
          onClick={() => setIsCreateModalOpen(true)}
          className="w-[200px] justify-start gap-2 bg-neutral-50/50 hover:bg-neutral-100/50 dark:bg-neutral-800/50 dark:hover:bg-neutral-700/50 border-neutral-200/50 dark:border-neutral-700/50"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm font-medium">Create Workspace</span>
        </Button>
        <CreateWorkspaceModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between bg-neutral-50/50 hover:bg-neutral-100/50 dark:bg-neutral-800/50 dark:hover:bg-neutral-700/50 border-neutral-200/50 dark:border-neutral-700/50"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {selectedWorkspace ? (
              <>
                <AvatarWithFallback
                  fallbackText={selectedWorkspace.name}
                  alt={selectedWorkspace.name}
                  size="sm"
                  src={selectedWorkspace.avatarUrl || undefined}
                />
                <span className="truncate text-sm font-medium">{selectedWorkspace.name}</span>
              </>
            ) : (
              <span className="text-sm text-neutral-500">Select workspace</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="p-2">
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {workspaces.map((workspace: WorkspaceListItem) => (
              <button
                key={workspace.id}
                onClick={() => handleWorkspaceSelect(workspace.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  selectedWorkspaceId === workspace.id && "bg-primary-50 dark:bg-primary-950/50"
                )}
              >
                <AvatarWithFallback
                  fallbackText={workspace.name}
                  alt={workspace.name}
                  size="sm"
                  src={workspace.avatarUrl || undefined}
                />
                <div className="flex flex-1 flex-col items-start">
                  <span className="font-medium">{workspace.name}</span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {workspace.role}
                  </span>
                </div>
                {selectedWorkspaceId === workspace.id && (
                  <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                )}
              </button>
            ))}
          </div>
          <div className="mt-2 border-t border-neutral-200 pt-2 dark:border-neutral-800">
            <button
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              onClick={() => {
                setOpen(false);
                setIsCreateModalOpen(true);
              }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700">
                <Plus className="h-4 w-4" />
              </div>
              <span>Create Workspace</span>
            </button>
          </div>
        </div>
      </PopoverContent>
      <CreateWorkspaceModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
    </Popover>
  );
}
