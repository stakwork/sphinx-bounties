"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
          className="w-[200px] justify-between"
        >
          <span className="truncate">{selectedWorkspace.name}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="p-2">
          <div className="space-y-1">
            {workspaces.map((workspace) => (
              <Button
                key={workspace.id}
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setSelectedWorkspace(workspace);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "h-4 w-4",
                    selectedWorkspace.id === workspace.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-1 flex-col items-start text-sm">
                  <span className="font-medium">{workspace.name}</span>
                  <span className="text-xs text-muted-foreground">{workspace.role}</span>
                </div>
              </Button>
            ))}
          </div>
          <div className="mt-2 border-t pt-2">
            <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
              <Plus className="h-4 w-4" />
              <span>Create Workspace</span>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
