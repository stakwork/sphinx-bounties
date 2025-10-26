"use client";

import { useState } from "react";
import { useAuth } from "@/hooks";
import {
  useGetBountyComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from "@/hooks/queries/use-bounty-comment-queries";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AvatarWithFallback } from "@/components/common";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send, Loader2, Edit2, Trash2, X } from "lucide-react";
import type { BountyDetail, BountyComment } from "@/types";

interface BountyCommentsProps {
  bounty: BountyDetail;
}

export function BountyComments({ bounty }: BountyCommentsProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetBountyComments(bounty.id, { page, pageSize: 20 });
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

  const comments = data?.items || [];
  const pagination = data?.pagination;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await createComment.mutateAsync({ bountyId: bounty.id, content: newComment.trim() });
      setNewComment("");
    } catch (_error) {
      // Error handled by mutation
    }
  };

  const handleEdit = (comment: BountyComment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent("");
  };

  const handleUpdateSubmit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      await updateComment.mutateAsync({
        bountyId: bounty.id,
        commentId,
        content: editContent.trim(),
      });
      setEditingCommentId(null);
      setEditContent("");
    } catch (_error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      await deleteComment.mutateAsync({ bountyId: bounty.id, commentId });
    } catch (_error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-neutral-600" />
        <h3 className="text-lg font-semibold">
          Comments {pagination && `(${pagination.totalCount})`}
        </h3>
      </div>

      {/* Comment Form */}
      {user && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            minLength={1}
            maxLength={5000}
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!newComment.trim() || createComment.isPending}
              size="sm"
              className="gap-2"
            >
              {createComment.isPending ? (
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

      {/* Comment List */}
      <div className="space-y-4">
        {isLoading ? (
          <>
            <CommentSkeleton />
            <CommentSkeleton />
            <CommentSkeleton />
          </>
        ) : comments.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((c: BountyComment) => {
            const isAuthor = user?.pubkey === c.authorPubkey;
            const isEditing = editingCommentId === c.id;

            return (
              <div key={c.id} className="flex gap-3 group">
                <AvatarWithFallback
                  src={c.author.avatarUrl}
                  alt={c.author.alias || c.author.username}
                  size="sm"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {c.author.alias || c.author.username}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {new Date(c.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {c.updatedAt !== c.createdAt && " (edited)"}
                      </span>
                    </div>
                    {isAuthor && !isEditing && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(c)}
                          className="h-7 px-2"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(c.id)}
                          className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        disabled={updateComment.isPending}
                        className="resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateSubmit(c.id)}
                          disabled={updateComment.isPending || !editContent.trim()}
                        >
                          {updateComment.isPending ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          disabled={updateComment.isPending}
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-700 whitespace-pre-wrap">{c.content}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
          <p className="text-sm text-neutral-600">
            Page {pagination.page} of {pagination.totalPages}
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
