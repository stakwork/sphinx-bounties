"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateWorkspace, useUpdateWorkspace } from "@/hooks/queries/use-workspace-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { fetchFavicon, isValidUrl } from "@/lib/utils/favicon";
import { Loader2 } from "lucide-react";
import type { WorkspaceDetailsResponse } from "@/types";

interface WorkspaceFormProps {
  workspace?: WorkspaceDetailsResponse;
  onSuccess?: () => void;
}

export function WorkspaceForm({ workspace, onSuccess }: WorkspaceFormProps) {
  const router = useRouter();
  const isEditing = !!workspace;

  const [name, setName] = useState(workspace?.name || "");
  const [description, setDescription] = useState(workspace?.description || "");
  const [mission, setMission] = useState(workspace?.mission || "");
  const [websiteUrl, setWebsiteUrl] = useState(workspace?.websiteUrl || "");
  const [githubUrl, setGithubUrl] = useState(workspace?.githubUrl || "");
  const [avatarUrl, setAvatarUrl] = useState(workspace?.avatarUrl || "");

  const createMutation = useCreateWorkspace();
  const updateMutation = useUpdateWorkspace();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Auto-fetch favicon from website URL (only for new workspaces)
  useEffect(() => {
    if (!isEditing && websiteUrl && isValidUrl(websiteUrl)) {
      const fetchFaviconFromWebsite = async () => {
        const favicon = await fetchFavicon(websiteUrl);
        if (favicon) {
          setAvatarUrl(favicon);
        }
      };

      const timeoutId = setTimeout(fetchFaviconFromWebsite, 800);
      return () => clearTimeout(timeoutId);
    }
  }, [websiteUrl, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim() || name.length < 3) {
      return;
    }

    const data: {
      name: string;
      description?: string;
      mission?: string;
      avatarUrl?: string;
      websiteUrl?: string;
      githubUrl?: string;
    } = {
      name: name.trim(),
    };

    if (description) data.description = description.trim();
    if (mission) data.mission = mission.trim();
    if (avatarUrl) data.avatarUrl = avatarUrl.trim();
    if (websiteUrl) data.websiteUrl = websiteUrl.trim();
    if (githubUrl) data.githubUrl = githubUrl.trim();

    if (isEditing && workspace) {
      await updateMutation.mutateAsync(
        { id: workspace.id, data },
        {
          onSuccess: () => {
            onSuccess?.();
            router.push(`/workspaces/${workspace.id}`);
          },
        }
      );
    } else {
      await createMutation.mutateAsync(data, {
        onSuccess: (responseData) => {
          onSuccess?.();
          if (responseData?.id) {
            router.push(`/workspaces/${responseData.id}`);
          } else {
            router.push("/workspaces");
          }
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Workspace Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Workspace Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Bitcoin Core Development"
          required
          minLength={3}
          maxLength={100}
          disabled={isLoading}
        />
        <p className="text-xs text-neutral-500">
          Choose a clear name for your workspace (3-100 characters)
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of your workspace..."
          rows={3}
          maxLength={500}
          disabled={isLoading}
        />
        <p className="text-xs text-neutral-500">
          Optional: Describe what your workspace is about (3-500 characters if provided)
        </p>
      </div>

      {/* Mission */}
      <div className="space-y-2">
        <Label htmlFor="mission">Mission Statement</Label>
        <Textarea
          id="mission"
          value={mission}
          onChange={(e) => setMission(e.target.value)}
          placeholder="Your workspace's mission and goals..."
          rows={4}
          maxLength={1000}
          disabled={isLoading}
        />
        <p className="text-xs text-neutral-500">
          Optional: Share your workspace&apos;s mission and goals (3-1000 characters if provided)
        </p>
      </div>

      {/* Website URL */}
      <div className="space-y-2">
        <Label htmlFor="websiteUrl">Website URL</Label>
        <Input
          id="websiteUrl"
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://yourwebsite.com"
          disabled={isLoading}
        />
        <p className="text-xs text-neutral-500">
          Optional: Link to your project or organization website
        </p>
      </div>

      {/* GitHub URL */}
      <div className="space-y-2">
        <Label htmlFor="githubUrl">GitHub URL</Label>
        <Input
          id="githubUrl"
          type="url"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          placeholder="https://github.com/username or https://github.com/username/repo"
          disabled={isLoading}
        />
        <p className="text-xs text-neutral-500">
          Optional: Link to your GitHub user, organization, or repository
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4">
        <Button type="submit" disabled={isLoading} size="lg" className="flex-1 sm:flex-none">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Update Workspace" : "Create Workspace"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (isEditing && workspace) {
              router.push(`/workspaces/${workspace.id}`);
            } else {
              router.push("/workspaces");
            }
          }}
          disabled={isLoading}
          size="lg"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
