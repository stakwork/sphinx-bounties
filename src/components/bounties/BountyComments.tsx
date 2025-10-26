"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AvatarWithFallback } from "@/components/common";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import type { BountyDetail } from "@/types";

interface BountyCommentsProps {
  bounty: BountyDetail;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    pubkey: string;
    username: string;
    alias: string | null;
    avatarUrl: string | null;
  };
}

export function BountyComments({ bounty }: BountyCommentsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  // Fetch comments
  const { data: commentsData, isLoading } = useQuery({
    queryKey: ["bounty-comments", bounty.id],
    queryFn: async () => {
      const response = await fetch(`/api/bounties/${bounty.id}/comments?limit=50`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      const result = await response.json();
      return result.data as Comment[];
    },
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/bounties/${bounty.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to post comment");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bounty-comments", bounty.id] });
      setComment("");
      toast.success("Comment posted!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to post comment");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;
    createCommentMutation.mutate(comment);
  };

  const comments = commentsData || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-neutral-600" />
        <h3 className="text-lg font-semibold">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h3>
      </div>

      {/* Comment List */}
      <div className="space-y-4">
        {isLoading ? (
          <>
            <CommentSkeleton />
            <CommentSkeleton />
          </>
        ) : comments.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <AvatarWithFallback
                src={c.author.avatarUrl}
                alt={c.author.alias || c.author.username}
                size="sm"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{c.author.alias || c.author.username}</span>
                  <span className="text-xs text-neutral-500">
                    {new Date(c.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-neutral-700 whitespace-pre-wrap">{c.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment Form */}
      {user && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            minLength={1}
            maxLength={5000}
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!comment.trim() || createCommentMutation.isPending}
              size="sm"
              className="gap-2"
            >
              {createCommentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Post Comment
            </Button>
          </div>
        </form>
      )}

      {!user && (
        <p className="text-sm text-neutral-500 text-center py-4">Please log in to comment</p>
      )}
    </div>
  );
}

function CommentSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}
