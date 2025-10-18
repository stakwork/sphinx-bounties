/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormInput } from "@/components/forms";
import { updateSocialLinksAction, verifyGithubAction, verifyTwitterAction } from "@/actions";
import { showSuccess, showError, showInfo } from "@/lib/toast";

const socialLinksSchema = z.object({
  githubUsername: z
    .string()
    .max(50, "GitHub username too long")
    .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/, "Invalid GitHub username")
    .optional()
    .or(z.literal("")),
  twitterUsername: z
    .string()
    .max(15, "Twitter username too long")
    .regex(/^[a-zA-Z0-9_]+$/, "Invalid Twitter username")
    .optional()
    .or(z.literal("")),
});

type SocialLinksInput = z.infer<typeof socialLinksSchema>;

interface UserData {
  pubkey: string;
  githubUsername?: string | null;
  githubVerified: boolean;
  twitterUsername?: string | null;
  twitterVerified: boolean;
}

interface SocialLinksFormProps {
  user: UserData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SocialLinksForm({ user, onSuccess, onCancel }: SocialLinksFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState<"github" | "twitter" | null>(null);

  const form = useForm<SocialLinksInput>({
    // @ts-expect-error - react-hook-form generic type issue with Zod
    resolver: zodResolver(socialLinksSchema),
    defaultValues: {
      githubUsername: user.githubUsername ?? undefined,
      twitterUsername: user.twitterUsername ?? undefined,
    },
  });

  const onSubmit = async (data: SocialLinksInput) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (data.githubUsername) formData.append("githubUsername", data.githubUsername);
      if (data.twitterUsername) formData.append("twitterUsername", data.twitterUsername);

      const result = await updateSocialLinksAction(user.pubkey, formData);

      if (result.success) {
        showSuccess("Social links updated successfully!");
        onSuccess?.();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to update social links");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyGithub = async () => {
    setIsVerifying("github");
    try {
      const formData = new FormData();
      formData.append("code", "placeholder");

      await verifyGithubAction(user.pubkey, formData);
      showInfo("GitHub verification coming soon with OAuth integration");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setIsVerifying(null);
    }
  };

  const handleVerifyTwitter = async () => {
    setIsVerifying("twitter");
    try {
      const formData = new FormData();
      formData.append("code", "placeholder");

      await verifyTwitterAction(user.pubkey, formData);
      showInfo("Twitter verification coming soon with OAuth integration");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setIsVerifying(null);
    }
  };

  return (
    <Form {...form}>
      {/* @ts-expect-error - react-hook-form generic type issue with Zod */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <FormField
                control={form.control}
                name="githubUsername"
                render={({ field }) => (
                  <FormInput
                    label="GitHub Username"
                    placeholder="octocat"
                    {...field}
                    value={field.value ?? undefined}
                  />
                )}
              />
            </div>
            <div className="flex items-center gap-2">
              {user.githubVerified ? (
                <Badge variant="default">Verified</Badge>
              ) : user.githubUsername ? (
                <Badge variant="secondary">Unverified</Badge>
              ) : null}
              {user.githubUsername && !user.githubVerified && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleVerifyGithub}
                  disabled={isVerifying === "github"}
                >
                  {isVerifying === "github" ? "Verifying..." : "Verify"}
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <FormField
                control={form.control}
                name="twitterUsername"
                render={({ field }) => (
                  <FormInput
                    label="Twitter Username"
                    placeholder="username"
                    {...field}
                    value={field.value ?? undefined}
                  />
                )}
              />
            </div>
            <div className="flex items-center gap-2">
              {user.twitterVerified ? (
                <Badge variant="default">Verified</Badge>
              ) : user.twitterUsername ? (
                <Badge variant="secondary">Unverified</Badge>
              ) : null}
              {user.twitterUsername && !user.twitterVerified && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleVerifyTwitter}
                  disabled={isVerifying === "twitter"}
                >
                  {isVerifying === "twitter" ? "Verifying..." : "Verify"}
                </Button>
              )}
            </div>
          </div>
        </div>

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
