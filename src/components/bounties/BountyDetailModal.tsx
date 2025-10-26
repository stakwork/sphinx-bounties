"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BountyDetail } from "./BountyDetail";

interface BountyDetailModalProps {
  bountyId: string;
}

export function BountyDetailModal({ bountyId }: BountyDetailModalProps) {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>
        <BountyDetail bountyId={bountyId} />
      </DialogContent>
    </Dialog>
  );
}
