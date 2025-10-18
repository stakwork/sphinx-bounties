/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormInput, FormTextarea } from "@/components/forms";
import { createWorkspaceSchema } from "@/validations/workspace.schema";
import { createWorkspaceAction } from "@/actions";
import { showSuccess, showError } from "@/lib/toast";
import type { CreateWorkspaceInput } from "@/validations/workspace.schema";

interface CreateWorkspaceFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateWorkspaceForm({ onSuccess, onCancel }: CreateWorkspaceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateWorkspaceInput>({
    // @ts-expect-error - react-hook-form generic type issue with Zod
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: "",
      description: "",
      mission: "",
      avatarUrl: "",
      websiteUrl: "",
      githubUrl: "",
    },
  });

  const onSubmit = async (data: CreateWorkspaceInput) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.description) formData.append("description", data.description);
      if (data.mission) formData.append("mission", data.mission);
      if (data.avatarUrl) formData.append("avatarUrl", data.avatarUrl);
      if (data.websiteUrl) formData.append("websiteUrl", data.websiteUrl);
      if (data.githubUrl) formData.append("githubUrl", data.githubUrl);

      const result = await createWorkspaceAction(formData);

      if (result.success) {
        showSuccess("Workspace created successfully!");
        onSuccess?.();
        router.push(`/workspaces/${result.data.id}`);
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to create workspace");
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
              required
              {...field}
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
            {isSubmitting ? "Creating..." : "Create Workspace"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
