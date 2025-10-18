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
import { deleteAccountSchema } from "@/validations/user.schema";
import { deleteUserAction } from "@/actions";
import { showSuccess, showError } from "@/lib/toast";
import type { DeleteAccountInput } from "@/validations/user.schema";

interface DeleteAccountFormProps {
  pubkey: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DeleteAccountForm({ pubkey, onSuccess, onCancel }: DeleteAccountFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DeleteAccountInput>({
    // @ts-expect-error - react-hook-form generic type issue with Zod
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      confirmation: "",
      reason: "",
    },
  });

  const onSubmit = async (data: DeleteAccountInput) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("confirmation", data.confirmation);
      if (data.reason) formData.append("reason", data.reason);

      const result = await deleteUserAction(pubkey, formData);

      if (result.success) {
        showSuccess("Account deleted successfully");
        onSuccess?.();
        router.push("/");
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to delete account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <h3 className="font-semibold text-destructive mb-2">Warning: This action is permanent</h3>
        <p className="text-sm text-muted-foreground">
          Deleting your account will permanently remove all your data. This action cannot be undone.
          You will not be able to delete your account if you:
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
          <li>Own any active workspaces</li>
          <li>Have assigned or in-review bounties</li>
        </ul>
      </div>

      <Form {...form}>
        {/* @ts-expect-error - react-hook-form generic type issue with Zod */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="confirmation"
            render={({ field }) => (
              <FormInput
                label='Type "DELETE" to confirm'
                placeholder="DELETE"
                required
                {...field}
              />
            )}
          />

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormTextarea
                label="Reason for Leaving (Optional)"
                placeholder="Help us improve by telling us why you're leaving..."
                rows={4}
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
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? "Deleting Account..." : "Delete Account"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
