/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  FormInput,
  FormTextarea,
  FormSelect,
  FormTagInput,
  FormDatePicker,
  FormAmountInput,
} from "@/components/forms";
import { createBountySchema } from "@/validations/bounty.schema";
import { createBountyAction } from "@/actions";
import { showSuccess, showError } from "@/lib/toast";
import type { CreateBountyInput } from "@/validations/bounty.schema";

const statusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "OPEN", label: "Open" },
];

interface CreateBountyFormProps {
  workspaceId: string;
  onSuccess?: () => void;
}

export function CreateBountyForm({ workspaceId, onSuccess }: CreateBountyFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateBountyInput>({
    // @ts-expect-error - react-hook-form generic type issue with Zod
    resolver: zodResolver(createBountySchema),
    defaultValues: {
      workspaceId,
      title: "",
      description: "",
      amount: 1000,
      status: "DRAFT",
      tags: [],
      programmingLanguages: [],
    },
  });

  const onSubmit = async (data: CreateBountyInput) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("workspaceId", data.workspaceId);
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("amount", data.amount.toString());

      if (data.deadline) {
        formData.append("deadline", data.deadline.toISOString());
      }
      if (data.githubIssueUrl) {
        formData.append("githubIssueUrl", data.githubIssueUrl);
      }
      if (data.tags && data.tags.length > 0) {
        formData.append("tags", JSON.stringify(data.tags));
      }
      if (data.programmingLanguages && data.programmingLanguages.length > 0) {
        formData.append("programmingLanguages", JSON.stringify(data.programmingLanguages));
      }
      if (data.status) {
        formData.append("status", data.status);
      }

      const result = await createBountyAction(formData);

      if (result.success) {
        showSuccess("Bounty created successfully!");
        form.reset();
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/bounties/${result.data.id}`);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        showError(error.message);
      } else {
        showError("Failed to create bounty");
      }
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
          name="title"
          render={({ field }) => (
            <FormInput
              label="Bounty Title"
              placeholder="Fix authentication bug in user login"
              description="A clear, descriptive title for the bounty"
              {...field}
            />
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormTextarea
              label="Description"
              placeholder="Describe what needs to be done, acceptance criteria, and any important details..."
              description="Provide detailed information about the task"
              maxLength={5000}
              rows={6}
              {...field}
            />
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormAmountInput
                label="Bounty Amount"
                description="Amount in satoshis"
                placeholder="1000"
                {...field}
                value={field.value}
                onValueChange={field.onChange}
              />
            )}
          />

          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormDatePicker
                label="Deadline (Optional)"
                description="When should this be completed?"
                placeholder="Select a date"
                value={field.value}
                onValueChange={field.onChange}
                disablePast
              />
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="githubIssueUrl"
          render={({ field }) => (
            <FormInput
              label="GitHub Issue URL (Optional)"
              placeholder="https://github.com/owner/repo/issues/123"
              description="Link to the related GitHub issue"
              {...field}
            />
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormTagInput
              label="Tags"
              description="Add relevant tags (max 10)"
              placeholder="Add a tag..."
              maxTags={10}
              value={field.value || []}
              onValueChange={field.onChange}
            />
          )}
        />

        <FormField
          control={form.control}
          name="programmingLanguages"
          render={({ field }) => (
            <FormTagInput
              label="Programming Languages"
              description="What languages are involved? (max 5)"
              placeholder="e.g., TypeScript, Python..."
              maxTags={5}
              value={field.value || []}
              onValueChange={field.onChange}
            />
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormSelect
              label="Initial Status"
              description="Draft bounties are not visible to others"
              options={statusOptions}
              {...field}
            />
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Bounty"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
