/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormInput, FormTextarea } from "@/components/forms";
import { updateProfileSchema } from "@/validations/user.schema";
import { updateProfileAction } from "@/actions";
import { showSuccess, showError } from "@/lib/toast";
import type { UpdateProfileInput } from "@/validations/user.schema";

interface UserData {
  pubkey: string;
  username: string;
  alias?: string | null;
  description?: string | null;
  avatarUrl?: string | null;
  contactKey?: string | null;
  routeHint?: string | null;
}

interface UpdateProfileFormProps {
  user: UserData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UpdateProfileForm({ user, onSuccess, onCancel }: UpdateProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateProfileInput>({
    // @ts-expect-error - react-hook-form generic type issue with Zod
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      username: user.username,
      alias: user.alias ?? undefined,
      description: user.description ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      contactKey: user.contactKey ?? undefined,
      routeHint: user.routeHint ?? undefined,
    },
  });

  const onSubmit = async (data: UpdateProfileInput) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (data.username) formData.append("username", data.username);
      if (data.alias) formData.append("alias", data.alias);
      if (data.description) formData.append("description", data.description);
      if (data.avatarUrl) formData.append("avatarUrl", data.avatarUrl);
      if (data.contactKey) formData.append("contactKey", data.contactKey);
      if (data.routeHint) formData.append("routeHint", data.routeHint);

      const result = await updateProfileAction(user.pubkey, formData);

      if (result.success) {
        showSuccess("Profile updated successfully!");
        onSuccess?.();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to update profile");
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
          name="username"
          render={({ field }) => (
            <FormInput
              label="Username"
              placeholder="Your unique username"
              {...field}
              value={field.value ?? undefined}
            />
          )}
        />

        <FormField
          control={form.control}
          name="alias"
          render={({ field }) => (
            <FormInput
              label="Display Name"
              placeholder="How you want to be called"
              {...field}
              value={field.value ?? undefined}
            />
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormTextarea
              label="Bio"
              placeholder="Tell us about yourself..."
              rows={4}
              {...field}
              value={field.value ?? undefined}
            />
          )}
        />

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
          name="contactKey"
          render={({ field }) => (
            <FormInput
              label="Contact Key"
              placeholder="66-character hex contact key"
              {...field}
              value={field.value ?? undefined}
            />
          )}
        />

        <FormField
          control={form.control}
          name="routeHint"
          render={({ field }) => (
            <FormTextarea
              label="Route Hint"
              placeholder="Lightning network route hint"
              rows={3}
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
