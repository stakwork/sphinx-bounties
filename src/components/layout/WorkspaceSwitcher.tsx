"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AvatarWithFallback } from "@/components/common";
import { cn } from "@/lib/utils";

const workspaces = [
  { id: "1", name: "Personal", role: "Owner" },
  { id: "2", name: "Sphinx Team", role: "Admin" },
];

export function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(workspaces[0]);

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
            <AvatarWithFallback
              fallbackText={selectedWorkspace.name}
              alt={selectedWorkspace.name}
              size="sm"
            />
            <span className="truncate text-sm font-medium">{selectedWorkspace.name}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="p-2">
          <div className="space-y-1">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => {
                  setSelectedWorkspace(workspace);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  selectedWorkspace.id === workspace.id && "bg-primary-50 dark:bg-primary-950/50"
                )}
              >
                <AvatarWithFallback fallbackText={workspace.name} alt={workspace.name} size="sm" />
                <div className="flex flex-1 flex-col items-start">
                  <span className="font-medium">{workspace.name}</span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {workspace.role}
                  </span>
                </div>
                {selectedWorkspace.id === workspace.id && (
                  <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                )}
              </button>
            ))}
          </div>
          <div className="mt-2 border-t border-neutral-200 pt-2 dark:border-neutral-800">
            <button
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              onClick={() => setOpen(false)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700">
                <Plus className="h-4 w-4" />
              </div>
              <span>Create Workspace</span>
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
