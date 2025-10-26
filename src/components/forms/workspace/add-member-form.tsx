/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormInput, FormSelect } from "@/components/forms";
import { inviteMemberSchema } from "@/validations/workspace.schema";
import { addMemberAction } from "@/actions";
import { showSuccess, showError } from "@/lib/toast";
import type { InviteMemberInput } from "@/validations/workspace.schema";
import { WorkspaceRole } from "@/types/enums";

const roleOptions = [
  { value: WorkspaceRole.CONTRIBUTOR, label: "Contributor" },
  { value: WorkspaceRole.ADMIN, label: "Admin" },
  { value: WorkspaceRole.VIEWER, label: "Viewer" },
];

interface AddMemberFormProps {
  workspaceId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddMemberForm({ workspaceId, onSuccess, onCancel }: AddMemberFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InviteMemberInput>({
    // @ts-expect-error - react-hook-form generic type issue with Zod
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      workspaceId,
      userPubkey: "",
      role: WorkspaceRole.CONTRIBUTOR,
      message: "",
    },
  });

  const onSubmit = async (data: InviteMemberInput) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("userPubkey", data.userPubkey);
      formData.append("role", data.role);
      if (data.message) formData.append("message", data.message);

      const result = await addMemberAction(workspaceId, formData);

      if (result.success) {
        showSuccess("Member added successfully!");
        form.reset();
        onSuccess?.();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to add member");
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
          name="userPubkey"
          render={({ field }) => (
            <FormInput
              label="User Public Key"
              placeholder="Enter the user's 66-character hex pubkey"
              required
              {...field}
            />
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormSelect
              label="Role"
              placeholder="Select a role"
              options={roleOptions}
              value={field.value}
              onValueChange={field.onChange}
            />
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormInput
              label="Welcome Message (Optional)"
              placeholder="A brief message for the new member"
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
            {isSubmitting ? "Adding..." : "Add Member"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
