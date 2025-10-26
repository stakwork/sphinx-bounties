"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AvatarWithFallback } from "@/components/common";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks";
import { FileCheck, ExternalLink, Loader2, Upload } from "lucide-react";
import type { BountyDetail } from "@/types";

interface BountyProofsProps {
  bounty: BountyDetail;
}

interface Proof {
  id: string;
  proofUrl: string;
  description: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CHANGES_REQUESTED";
  createdAt: string;
  submitter: {
    pubkey: string;
    username: string;
    alias: string | null;
    avatarUrl: string | null;
  };
  reviewer: {
    pubkey: string;
    username: string;
    alias: string | null;
  } | null;
  reviewNotes: string | null;
  reviewedAt: string | null;
}

export function BountyProofs({ bounty }: BountyProofsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [proofDescription, setProofDescription] = useState("");

  const isAssignee = user && bounty.assignee && bounty.assignee.pubkey === user.pubkey;
  const canSubmitProof = isAssignee && bounty.status === "ASSIGNED";

  // Listen for custom event to open proof submission modal
  useEffect(() => {
    const handleOpenProofSubmission = () => {
      if (canSubmitProof) {
        setIsSubmitModalOpen(true);
      }
    };

    window.addEventListener("openProofSubmission", handleOpenProofSubmission);
    return () => window.removeEventListener("openProofSubmission", handleOpenProofSubmission);
  }, [canSubmitProof]);

  // Fetch proofs
  const { data: proofsData, isLoading } = useQuery({
    queryKey: ["bounty-proofs", bounty.id],
    queryFn: async () => {
      const response = await fetch(`/api/bounties/${bounty.id}/proofs`);
      if (!response.ok) throw new Error("Failed to fetch proofs");
      const result = await response.json();
      return result.data as Proof[];
    },
  });

  // Submit proof mutation
  const submitProofMutation = useMutation({
    mutationFn: async (data: { proofUrl: string; description: string }) => {
      const response = await fetch(`/api/bounties/${bounty.id}/proofs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to submit proof");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bounty-proofs", bounty.id] });
      queryClient.invalidateQueries({ queryKey: ["bounty", bounty.id] });
      setIsSubmitModalOpen(false);
      setProofUrl("");
      setProofDescription("");
      toast.success("Proof submitted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit proof");
    },
  });

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofUrl.trim() || !proofDescription.trim()) return;
    submitProofMutation.mutate({ proofUrl, description: proofDescription });
  };

  const proofs = proofsData || [];

  const getStatusColor = (status: Proof["status"]) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "ACCEPTED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "CHANGES_REQUESTED":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-neutral-600" />
          <h3 className="text-lg font-semibold">
            Proof Submissions {proofs.length > 0 && `(${proofs.length})`}
          </h3>
        </div>

        {canSubmitProof && (
          <Button onClick={() => setIsSubmitModalOpen(true)} size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            Submit Proof
          </Button>
        )}
      </div>

      {/* Proofs List */}
      <div className="space-y-4">
        {isLoading ? (
          <>
            <ProofSkeleton />
            <ProofSkeleton />
          </>
        ) : proofs.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-8">No proof submissions yet</p>
        ) : (
          proofs.map((proof) => (
            <div key={proof.id} className="border border-neutral-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AvatarWithFallback
                    src={proof.submitter.avatarUrl}
                    alt={proof.submitter.alias || proof.submitter.username}
                    size="sm"
                  />
                  <div>
                    <p className="font-medium text-sm">
                      {proof.submitter.alias || proof.submitter.username}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {new Date(proof.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(proof.status)}>{proof.status}</Badge>
              </div>

              <p className="text-sm text-neutral-700">{proof.description}</p>

              <a
                href={proof.proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
              >
                View Proof
                <ExternalLink className="h-3 w-3" />
              </a>

              {proof.reviewer && proof.reviewNotes && (
                <div className="mt-3 pt-3 border-t border-neutral-200 space-y-1">
                  <p className="text-xs font-medium text-neutral-600">
                    Review by {proof.reviewer.alias || proof.reviewer.username}
                  </p>
                  <p className="text-sm text-neutral-700">{proof.reviewNotes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Submit Proof Dialog */}
      <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Submit Proof of Work</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitProof} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="proofUrl" className="text-sm font-medium">
                Proof URL *
              </label>
              <Input
                id="proofUrl"
                type="url"
                placeholder="https://github.com/user/repo/pull/123"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                required
              />
              <p className="text-xs text-neutral-500">
                Link to your pull request, demo, or completed work
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description *
              </label>
              <Textarea
                id="description"
                placeholder="Describe what you've completed and any relevant details..."
                value={proofDescription}
                onChange={(e) => setProofDescription(e.target.value)}
                minLength={10}
                maxLength={2000}
                rows={4}
                required
              />
              <p className="text-xs text-neutral-500">Minimum 10 characters, maximum 2000</p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSubmitModalOpen(false)}
                disabled={submitProofMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitProofMutation.isPending}>
                {submitProofMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Proof
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProofSkeleton() {
  return (
    <div className="border border-neutral-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}
