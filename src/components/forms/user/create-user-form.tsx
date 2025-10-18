/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormInput, FormTextarea } from "@/components/forms";
import { createUserAction } from "@/actions";
import { showSuccess, showError } from "@/lib/toast";

const createUserSchema = z.object({
  pubkey: z.string().length(66, "Invalid pubkey format"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must not exceed 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  alias: z.string().max(50, "Alias must not exceed 50 characters").optional().or(z.literal("")),
  description: z.string().max(500, "Description must not exceed 500 characters").optional().or(z.literal("")),
  avatarUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  contactKey: z.string().length(66, "Invalid contact key format").optional().or(z.literal("")),
});

type CreateUserInput = z.infer<typeof createUserSchema>;

interface CreateUserFormProps {
  pubkey: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateUserForm({ pubkey, onSuccess, onCancel }: CreateUserFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateUserInput>({
    // @ts-expect-error - react-hook-form generic type issue with Zod
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      pubkey,
      username: "",
      alias: "",
      description: "",
      avatarUrl: "",
      contactKey: "",
    },
  });

  const onSubmit = async (data: CreateUserInput) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("pubkey", data.pubkey);
      formData.append("username", data.username);
      if (data.alias) formData.append("alias", data.alias);
      if (data.description) formData.append("description", data.description);
      if (data.avatarUrl) formData.append("avatarUrl", data.avatarUrl);
      if (data.contactKey) formData.append("contactKey", data.contactKey);

      const result = await createUserAction(formData);

      if (result.success) {
        showSuccess("Account created successfully!");
        onSuccess?.();
        router.push(`/people/${pubkey}`);
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to create account");
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
          name="pubkey"
          render={({ field }) => (
            <FormInput
              label="Public Key"
              placeholder="Your 66-character hex pubkey"
              required
              disabled
              {...field}
            />
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormInput
              label="Username"
              placeholder="Choose a unique username (3-20 chars)"
              required
              {...field}
            />
          )}
        />

        <FormField
          control={form.control}
          name="alias"
          render={({ field }) => (
            <FormInput
              label="Display Name (Optional)"
              placeholder="How you want to be called"
              {...field}
            />
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormTextarea
              label="Bio (Optional)"
              placeholder="Tell us about yourself..."
              rows={4}
              {...field}
            />
          )}
        />

        <FormField
          control={form.control}
          name="avatarUrl"
          render={({ field }) => (
            <FormInput
              label="Avatar URL (Optional)"
              placeholder="https://example.com/avatar.png"
              type="url"
              {...field}
            />
          )}
        />

        <FormField
          control={form.control}
          name="contactKey"
          render={({ field }) => (
            <FormInput
              label="Contact Key (Optional)"
              placeholder="66-character hex contact key"
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
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
