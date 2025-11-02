"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Plus } from "lucide-react";
import type { BountyDetail } from "@/types";
import { BountyStatus, ProgrammingLanguage } from "@/types/enums";

interface BountyFormProps {
  workspaceId: string;
  bounty?: BountyDetail;
  onSuccess?: () => void;
}

const PROGRAMMING_LANGUAGES = Object.values(ProgrammingLanguage);

export function BountyForm({ workspaceId, bounty, onSuccess }: BountyFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!bounty;

  // Form state
  const [title, setTitle] = useState(bounty?.title || "");
  const [description, setDescription] = useState(bounty?.description || "");
  const [amount, setAmount] = useState(bounty?.amount?.toString() || "");
  const [status, setStatus] = useState<BountyStatus>(bounty?.status || BountyStatus.DRAFT);
  const [estimatedHours, setEstimatedHours] = useState(bounty?.estimatedHours?.toString() || "");
  const [githubIssueUrl, setGithubIssueUrl] = useState(bounty?.githubIssueUrl || "");
  const [loomVideoUrl, setLoomVideoUrl] = useState(bounty?.loomVideoUrl || "");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    bounty?.codingLanguages || []
  );
  const [tags, setTags] = useState<string[]>(bounty?.tags || []);
  const [tagInput, setTagInput] = useState("");

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      deliverables: string;
      amount: number;
      status: BountyStatus;
      estimatedHours?: number;
      githubIssueUrl?: string;
      loomVideoUrl?: string;
      codingLanguages?: string[];
      tags?: string[];
    }) => {
      const url = isEditing
        ? `/api/workspaces/${workspaceId}/bounties/${bounty.id}`
        : `/api/workspaces/${workspaceId}/bounties`;

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error?.message || `Failed to ${isEditing ? "update" : "create"} bounty`
        );
      }

      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bounties"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-bounties", workspaceId] });

      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ["bounty", bounty.id] });
      }

      toast.success(`Bounty ${isEditing ? "updated" : "created"} successfully!`);

      if (onSuccess) {
        onSuccess();
      } else {
        const bountyId = isEditing ? bounty.id : data.data?.id;
        if (bountyId) {
          router.push(`/bounties/${bountyId}`);
        } else {
          router.push("/bounties");
        }
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || `Failed to ${isEditing ? "update" : "create"} bounty`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      title,
      description,
      deliverables: description,
      amount: Number(amount),
      status,
      ...(estimatedHours && { estimatedHours: Number(estimatedHours) }),
      ...(githubIssueUrl && { githubIssueUrl }),
      ...(loomVideoUrl && { loomVideoUrl }),
      ...(selectedLanguages.length > 0 && { codingLanguages: selectedLanguages }),
      ...(tags.length > 0 && { tags }),
    };

    mutation.mutate(data);
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      setSelectedLanguages(selectedLanguages.filter((l) => l !== lang));
    } else if (selectedLanguages.length < 10) {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Build a QR code generator component"
          required
          minLength={3}
          maxLength={200}
        />
        <p className="text-xs text-neutral-500">Clear, concise title (3-200 characters)</p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the work to be done, requirements, deliverables..."
          required
          minLength={50}
          maxLength={5000}
          rows={6}
          className="resize-none"
        />
        <p className="text-xs text-neutral-500">Detailed description (50-5000 characters)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">
            Amount (sats) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 50000"
            required
            min="1000"
            max="100000000"
          />
          <p className="text-xs text-neutral-500">Bounty reward in satoshis (1,000 - 100M)</p>
        </div>

        {/* Estimated Hours */}
        <div className="space-y-2">
          <Label htmlFor="estimatedHours">Estimated Hours</Label>
          <Input
            id="estimatedHours"
            type="number"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
            placeholder="e.g., 8"
            min="1"
            max="1000"
          />
          <p className="text-xs text-neutral-500">Estimated time to complete (optional)</p>
        </div>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={(value) => setStatus(value as BountyStatus)}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={BountyStatus.DRAFT}>Draft</SelectItem>
            <SelectItem value={BountyStatus.OPEN}>Open</SelectItem>
            {isEditing && <SelectItem value={BountyStatus.ASSIGNED}>Assigned</SelectItem>}
            {isEditing && <SelectItem value={BountyStatus.IN_REVIEW}>In Review</SelectItem>}
            {isEditing && <SelectItem value={BountyStatus.COMPLETED}>Completed</SelectItem>}
            {isEditing && <SelectItem value={BountyStatus.PAID}>Paid</SelectItem>}
          </SelectContent>
        </Select>
        <p className="text-xs text-neutral-500">Draft = Not visible, Open = Ready for claims</p>
      </div>

      {/* Programming Languages */}
      <div className="space-y-2">
        <Label>Programming Languages</Label>
        <div className="flex flex-wrap gap-2 p-3 border border-neutral-200 rounded-md min-h-[60px]">
          {PROGRAMMING_LANGUAGES.map((lang) => (
            <Badge
              key={lang}
              variant={selectedLanguages.includes(lang) ? "default" : "outline"}
              className="cursor-pointer hover:opacity-80"
              onClick={() => toggleLanguage(lang)}
            >
              {lang}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-neutral-500">Select relevant languages (max 10)</p>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tagInput">Tags</Label>
        <div className="flex gap-2">
          <Input
            id="tagInput"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Add tag (press Enter)"
            maxLength={30}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddTag}
            disabled={!tagInput.trim() || tags.length >= 10}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-neutral-500">Add custom tags (max 10)</p>
      </div>

      {/* URLs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="githubIssueUrl">GitHub Issue URL</Label>
          <Input
            id="githubIssueUrl"
            type="url"
            value={githubIssueUrl}
            onChange={(e) => setGithubIssueUrl(e.target.value)}
            placeholder="https://github.com/org/repo/issues/123"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="loomVideoUrl">Loom Video URL</Label>
          <Input
            id="loomVideoUrl"
            type="url"
            value={loomVideoUrl}
            onChange={(e) => setLoomVideoUrl(e.target.value)}
            placeholder="https://www.loom.com/share/..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Update" : "Create"} Bounty
        </Button>
      </div>
    </form>
  );
}
