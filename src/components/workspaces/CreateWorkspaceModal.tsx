"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WorkspaceForm } from "./WorkspaceForm";

interface CreateWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceModal({ open, onOpenChange }: CreateWorkspaceModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Workspace</DialogTitle>
        </DialogHeader>
        <WorkspaceForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
