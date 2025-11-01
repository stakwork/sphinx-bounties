import { z } from "zod";
import { WorkspaceRole } from "@/types/enums";

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must not exceed 50 characters")
    .regex(
      /^[a-zA-Z0-9-_\s]+$/,
      "Name can only contain letters, numbers, hyphens, underscores, and spaces"
    )
    .trim(),

  description: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .pipe(
      z
        .string()
        .min(10, "Description must be at least 10 characters")
        .max(120, "Description must not exceed 120 characters")
        .optional()
    ),

  mission: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .pipe(
      z
        .string()
        .min(20, "Mission must be at least 20 characters")
        .max(500, "Mission must not exceed 500 characters")
        .optional()
    ),

  avatarUrl: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .pipe(z.string().url("Must be a valid URL").max(2048, "URL too long").optional()),

  websiteUrl: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .pipe(z.string().url("Must be a valid URL").max(2048, "URL too long").optional()),

  githubUrl: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .pipe(
      z
        .string()
        .url("Must be a valid URL")
        .regex(/^https:\/\/github\.com\/[\w-]+\/?$/, "Must be a valid GitHub organization URL")
        .max(2048, "URL too long")
        .optional()
    ),
});

export const updateWorkspaceSchema = z.object({
  id: z.string().cuid("Invalid workspace ID"),

  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must not exceed 50 characters")
    .regex(
      /^[a-zA-Z0-9-_\s]+$/,
      "Name can only contain letters, numbers, hyphens, underscores, and spaces"
    )
    .trim()
    .optional(),

  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(120, "Description must not exceed 120 characters")
    .trim()
    .optional()
    .nullable()
    .or(z.literal("")),

  mission: z
    .string()
    .min(20, "Mission must be at least 20 characters")
    .max(500, "Mission must not exceed 500 characters")
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

  websiteUrl: z
    .string()
    .url("Must be a valid URL")
    .max(2048, "URL too long")
    .optional()
    .nullable()
    .or(z.literal("")),

  githubUrl: z
    .string()
    .url("Must be a valid URL")
    .regex(/^https:\/\/github\.com\/[\w-]+\/?$/, "Must be a valid GitHub organization URL")
    .max(2048, "URL too long")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export const inviteMemberSchema = z.object({
  workspaceId: z.string().cuid("Invalid workspace ID"),

  userPubkey: z
    .string()
    .length(66, "Invalid pubkey format")
    .regex(/^[0-9a-f]{66}$/i, "Invalid pubkey format"),

  role: z.nativeEnum(WorkspaceRole).default(WorkspaceRole.CONTRIBUTOR),

  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(500, "Message must not exceed 500 characters")
    .trim()
    .optional()
    .or(z.literal("")),
});

export const updateMemberRoleSchema = z.object({
  workspaceId: z.string().cuid("Invalid workspace ID"),

  membershipId: z.string().cuid("Invalid membership ID"),

  role: z.nativeEnum(WorkspaceRole),
});

export const removeMemberSchema = z.object({
  workspaceId: z.string().cuid("Invalid workspace ID"),

  membershipId: z.string().cuid("Invalid membership ID"),
});

export const depositBudgetSchema = z.object({
  workspaceId: z.string().cuid("Invalid workspace ID"),

  amount: z
    .number()
    .int("Amount must be a whole number")
    .positive("Amount must be positive")
    .min(1000, "Minimum deposit is 1,000 sats"),

  invoiceDetails: z
    .object({
      memo: z.string().optional(),
      expiresIn: z.number().int().positive().default(3600),
    })
    .optional(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
export type DepositBudgetInput = z.infer<typeof depositBudgetSchema>;
