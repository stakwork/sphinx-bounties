/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import { useState } from "react";
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
import { updateBountySchema } from "@/validations/bounty.schema";
import { updateBountyAction } from "@/actions";
import { showSuccess, showError } from "@/lib/toast";
import type { UpdateBountyInput } from "@/validations/bounty.schema";

const statusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "OPEN", label: "Open" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

interface BountyData {
  id: string;
  title: string;
  description: string;
  amount: bigint;
  deadline?: Date | null;
  githubIssueUrl?: string | null;
  tags: string[];
  programmingLanguages: string[];
  status: string;
}

interface UpdateBountyFormProps {
  bounty: BountyData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UpdateBountyForm({ bounty, onSuccess, onCancel }: UpdateBountyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateBountyInput>({
    // @ts-expect-error - react-hook-form generic type issue with Zod
    resolver: zodResolver(updateBountySchema),
    defaultValues: {
      title: bounty.title,
      description: bounty.description,
      amount: Number(bounty.amount),
      deadline: bounty.deadline ?? undefined,
      githubIssueUrl: bounty.githubIssueUrl ?? undefined,
      tags: bounty.tags,
      programmingLanguages: bounty.programmingLanguages,
      status: bounty.status as UpdateBountyInput["status"],
    },
  });

  const onSubmit = async (data: UpdateBountyInput) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      if (data.title) formData.append("title", data.title);
      if (data.description) formData.append("description", data.description);
      if (data.amount) formData.append("amount", data.amount.toString());
      if (data.deadline) formData.append("deadline", data.deadline.toISOString());
      if (data.githubIssueUrl) formData.append("githubIssueUrl", data.githubIssueUrl);
      if (data.tags) formData.append("tags", JSON.stringify(data.tags));
      if (data.programmingLanguages) {
        formData.append("programmingLanguages", JSON.stringify(data.programmingLanguages));
      }
      if (data.status) formData.append("status", data.status);

      const result = await updateBountyAction(bounty.id, formData);

      if (result.success) {
        showSuccess("Bounty updated successfully!");
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        showError(error.message);
      } else {
        showError("Failed to update bounty");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormInput label="Bounty Title" placeholder="Update title..." {...field} />
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormTextarea
              label="Description"
              placeholder="Update description..."
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
                placeholder="Select a date"
                value={field.value ?? undefined}
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
              {...field}
              value={field.value ?? undefined}
            />
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormTagInput
              label="Tags"
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
            <FormSelect label="Status" options={statusOptions} {...field} />
          )}
        />

        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Bounty"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
