/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormInput, FormTextarea } from "@/components/forms";
import { submitProofSchema } from "@/validations/bounty.schema";
import { submitProofAction } from "@/actions";
import { showSuccess, showError } from "@/lib/toast";
import type { SubmitProofInput } from "@/validations/bounty.schema";

interface SubmitProofFormProps {
  bountyId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SubmitProofForm({ bountyId, onSuccess, onCancel }: SubmitProofFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SubmitProofInput>({
    resolver: zodResolver(submitProofSchema),
    defaultValues: {
      bountyId,
      proofUrl: "",
      description: "",
    },
  });

  const onSubmit = async (data: SubmitProofInput) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("proofUrl", data.proofUrl);
      formData.append("description", data.description);

      const result = await submitProofAction(bountyId, formData);

      if (result.success) {
        showSuccess("Proof submitted successfully!");
        form.reset();
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        showError(error.message);
      } else {
        showError("Failed to submit proof");
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
          name="proofUrl"
          render={({ field }) => (
            <FormInput
              label="Proof URL"
              placeholder="https://github.com/owner/repo/pull/123"
              description="Link to your pull request, deployed demo, or other proof"
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
              placeholder="Describe what you've done and how it meets the requirements..."
              description="Explain your solution and any important implementation details"
              maxLength={2000}
              rows={6}
              {...field}
            />
          )}
        />

        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Proof"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
