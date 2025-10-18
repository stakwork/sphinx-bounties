import { z } from "zod";

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must not exceed 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .trim()
    .optional(),
  
  alias: z
    .string()
    .min(2, "Alias must be at least 2 characters")
    .max(50, "Alias must not exceed 50 characters")
    .trim()
    .optional()
    .nullable()
    .or(z.literal("")),
  
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .trim()
    .optional()
    .nullable()
    .or(z.literal("")),
  
  avatarUrl: z
    .string()
    .url("Must be a valid URL")
    .max(2048, "URL too long")
    .optional()
    .nullable()
    .or(z.literal("")),
  
  contactKey: z
    .string()
    .length(66, "Invalid contact key format")
    .regex(/^[0-9a-f]{66}$/i, "Invalid contact key format")
    .optional()
    .nullable()
    .or(z.literal("")),
  
  routeHint: z
    .string()
    .max(1000, "Route hint too long")
    .trim()
    .optional()
    .nullable()
    .or(z.literal("")),
  
  githubUsername: z
    .string()
    .min(1, "GitHub username is required")
    .max(50, "GitHub username too long")
    .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/, "Invalid GitHub username format")
    .trim()
    .optional()
    .nullable()
    .or(z.literal("")),
  
  twitterUsername: z
    .string()
    .min(1, "Twitter username is required")
    .max(15, "Twitter username must not exceed 15 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Invalid Twitter username format")
    .trim()
    .optional()
    .nullable()
    .or(z.literal("")),
});

export const verifyGithubSchema = z.object({
  code: z.string().min(1, "Verification code is required"),
});

export const verifyTwitterSchema = z.object({
  code: z.string().min(1, "Verification code is required"),
});

export const updateNotificationSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  
  pushNotifications: z.boolean().default(true),
  
  notifyOnBountyAssigned: z.boolean().default(true),
  
  notifyOnBountyCompleted: z.boolean().default(true),
  
  notifyOnPaymentReceived: z.boolean().default(true),
  
  notifyOnProofReviewed: z.boolean().default(true),
  
  notifyOnWorkspaceInvite: z.boolean().default(true),
  
  notifyOnMemberAdded: z.boolean().default(false),
});

export const deleteAccountSchema = z.object({
  confirmation: z
    .string()
    .refine((val) => val === "DELETE", {
      message: "Please type DELETE to confirm",
    }),
  
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must not exceed 500 characters")
    .trim()
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type VerifyGithubInput = z.infer<typeof verifyGithubSchema>;
export type VerifyTwitterInput = z.infer<typeof verifyTwitterSchema>;
export type UpdateNotificationSettingsInput = z.infer<typeof updateNotificationSettingsSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
