"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormTextarea } from "@/components/forms";
import { reviewProofSchema } from "@/validations/bounty.schema";
import { reviewProofAction } from "@/actions";
import { showSuccess, showError } from "@/lib/toast";
import type { ReviewProofInput } from "@/validations/bounty.schema";

interface ReviewProofFormProps {
  proofId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewProofForm({ proofId, onSuccess, onCancel }: ReviewProofFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReviewProofInput>({
    resolver: zodResolver(reviewProofSchema),
    defaultValues: {
      proofId,
      approved: false,
      feedback: "",
    },
  });

  const handleReview = async (approved: boolean) => {
    setIsSubmitting(true);
    try {
      const feedback = form.getValues("feedback");
      const formData = new FormData();
      formData.append("approved", approved.toString());
      if (feedback) {
        formData.append("reviewNotes", feedback);
      }

      const result = await reviewProofAction(proofId, formData);

      if (result.success) {
        showSuccess(`Proof ${approved ? "approved" : "rejected"} successfully!`);
        form.reset();
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        showError(error.message);
      } else {
        showError("Failed to review proof");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6">
        <FormField
          control={form.control}
          name="feedback"
          render={({ field }) => (
            <FormTextarea
              label="Review Feedback"
              placeholder="Provide feedback on the submission..."
              description="Explain your decision (required for rejections)"
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
          <Button
            type="button"
            variant="destructive"
            onClick={() => handleReview(false)}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Reject"}
          </Button>
          <Button
            type="button"
            onClick={() => handleReview(true)}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Approve"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
