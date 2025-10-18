/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormInput, FormTextarea } from "@/components/forms";
import { updateWorkspaceSchema } from "@/validations/workspace.schema";
import { updateWorkspaceAction } from "@/actions";
import { showSuccess, showError } from "@/lib/toast";
import type { UpdateWorkspaceInput } from "@/validations/workspace.schema";

interface WorkspaceData {
  id: string;
  name: string;
  description?: string | null;
  mission?: string | null;
  avatarUrl?: string | null;
  websiteUrl?: string | null;
  githubUrl?: string | null;
}

interface UpdateWorkspaceFormProps {
  workspace: WorkspaceData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UpdateWorkspaceForm({ workspace, onSuccess, onCancel }: UpdateWorkspaceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateWorkspaceInput>({
    // @ts-expect-error - react-hook-form generic type issue with Zod
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description ?? undefined,
      mission: workspace.mission ?? undefined,
      avatarUrl: workspace.avatarUrl ?? undefined,
      websiteUrl: workspace.websiteUrl ?? undefined,
      githubUrl: workspace.githubUrl ?? undefined,
    },
  });

  const onSubmit = async (data: UpdateWorkspaceInput) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (data.name) formData.append("name", data.name);
      if (data.description) formData.append("description", data.description);
      if (data.mission) formData.append("mission", data.mission);
      if (data.avatarUrl) formData.append("avatarUrl", data.avatarUrl);
      if (data.websiteUrl) formData.append("websiteUrl", data.websiteUrl);
      if (data.githubUrl) formData.append("githubUrl", data.githubUrl);

      const result = await updateWorkspaceAction(workspace.id, formData);

      if (result.success) {
        showSuccess("Workspace updated successfully!");
        onSuccess?.();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to update workspace");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      {/* @ts-expect-error - react-hook-form generic type issue with Zod */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormInput
              label="Workspace Name"
              placeholder="My Awesome Project"
              {...field}
              value={field.value ?? undefined}
            />
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormInput
              label="Description"
              placeholder="Brief description of your workspace (120 chars max)"
              {...field}
              value={field.value ?? undefined}
            />
          )}
        />

        <FormField
          control={form.control}
          name="mission"
          render={({ field }) => (
            <FormTextarea
              label="Mission Statement"
              placeholder="What is your workspace trying to achieve?"
              rows={4}
              {...field}
              value={field.value ?? undefined}
            />
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="avatarUrl"
            render={({ field }) => (
              <FormInput
                label="Avatar URL"
                placeholder="https://example.com/avatar.png"
                type="url"
                {...field}
                value={field.value ?? undefined}
              />
            )}
          />

          <FormField
            control={form.control}
            name="websiteUrl"
            render={({ field }) => (
              <FormInput
                label="Website URL"
                placeholder="https://example.com"
                type="url"
                {...field}
                value={field.value ?? undefined}
              />
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="githubUrl"
          render={({ field }) => (
            <FormInput
              label="GitHub Organization URL"
              placeholder="https://github.com/your-org"
              type="url"
              {...field}
              value={field.value ?? undefined}
            />
          )}
        />

        <div className="flex gap-3 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
