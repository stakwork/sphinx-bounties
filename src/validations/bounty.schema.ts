import { z } from "zod";
import { BountyStatus, ProgrammingLanguage } from "@/types/enums";
import { LIMITS } from "@/constants";

export const createBountySchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(LIMITS.MAX_TITLE_LENGTH, `Title must not exceed ${LIMITS.MAX_TITLE_LENGTH} characters`)
    .trim(),

  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(
      LIMITS.MAX_DESCRIPTION_LENGTH,
      `Description must not exceed ${LIMITS.MAX_DESCRIPTION_LENGTH} characters`
    )
    .trim(),

  deliverables: z
    .string()
    .min(10, "Deliverables must be at least 10 characters")
    .max(
      LIMITS.MAX_DESCRIPTION_LENGTH,
      `Deliverables must not exceed ${LIMITS.MAX_DESCRIPTION_LENGTH} characters`
    )
    .trim(),

  amount: z
    .number()
    .int("Amount must be a whole number")
    .min(LIMITS.MIN_BOUNTY_AMOUNT, `Minimum bounty amount is ${LIMITS.MIN_BOUNTY_AMOUNT} sats`)
    .max(LIMITS.MAX_BOUNTY_AMOUNT, `Maximum bounty amount is ${LIMITS.MAX_BOUNTY_AMOUNT} sats`),

  estimatedHours: z.number().int().positive().optional(),

  estimatedCompletionDate: z
    .date()
    .min(new Date(), "Estimated completion date must be in the future")
    .optional(),

  githubIssueUrl: z
    .string()
    .url("Must be a valid URL")
    .regex(
      /^https:\/\/github\.com\/[\w-]+\/[\w-]+\/issues\/\d+$/,
      "Must be a valid GitHub issue URL"
    )
    .optional()
    .or(z.literal("")),

  loomVideoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),

  tags: z
    .array(z.string().min(2).max(30))
    .max(LIMITS.MAX_TAGS, `Maximum ${LIMITS.MAX_TAGS} tags allowed`)
    .optional()
    .default([]),

  codingLanguages: z.array(z.nativeEnum(ProgrammingLanguage)).optional().default([]),

  status: z.nativeEnum(BountyStatus).default(BountyStatus.DRAFT),
});

export const updateBountySchema = z.object({
  id: z.string().cuid("Invalid bounty ID"),

  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(LIMITS.MAX_TITLE_LENGTH, `Title must not exceed ${LIMITS.MAX_TITLE_LENGTH} characters`)
    .trim()
    .optional(),

  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(
      LIMITS.MAX_DESCRIPTION_LENGTH,
      `Description must not exceed ${LIMITS.MAX_DESCRIPTION_LENGTH} characters`
    )
    .trim()
    .optional(),

  deliverables: z
    .string()
    .min(10, "Deliverables must be at least 10 characters")
    .max(
      LIMITS.MAX_DESCRIPTION_LENGTH,
      `Deliverables must not exceed ${LIMITS.MAX_DESCRIPTION_LENGTH} characters`
    )
    .trim()
    .optional(),

  amount: z
    .number()
    .int("Amount must be a whole number")
    .min(LIMITS.MIN_BOUNTY_AMOUNT, `Minimum bounty amount is ${LIMITS.MIN_BOUNTY_AMOUNT} sats`)
    .max(LIMITS.MAX_BOUNTY_AMOUNT, `Maximum bounty amount is ${LIMITS.MAX_BOUNTY_AMOUNT} sats`)
    .optional(),

  estimatedHours: z.number().int().positive().optional().nullable(),

  estimatedCompletionDate: z
    .date()
    .min(new Date(), "Estimated completion date must be in the future")
    .optional()
    .nullable(),

  githubIssueUrl: z
    .string()
    .url("Must be a valid URL")
    .regex(
      /^https:\/\/github\.com\/[\w-]+\/[\w-]+\/issues\/\d+$/,
      "Must be a valid GitHub issue URL"
    )
    .optional()
    .nullable()
    .or(z.literal("")),

  loomVideoUrl: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),

  tags: z
    .array(z.string().min(2).max(30))
    .max(LIMITS.MAX_TAGS, `Maximum ${LIMITS.MAX_TAGS} tags allowed`)
    .optional(),

  codingLanguages: z.array(z.nativeEnum(ProgrammingLanguage)).optional(),

  status: z.nativeEnum(BountyStatus).optional(),
});

export const claimBountySchema = z.object({
  bountyId: z.string().cuid("Invalid bounty ID"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(500, "Message must not exceed 500 characters")
    .trim()
    .optional(),
});

export const unclaimBountySchema = z.object({
  bountyId: z.string().cuid("Invalid bounty ID"),
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must not exceed 500 characters")
    .trim()
    .optional(),
});

export const completeBountySchema = z.object({
  bountyId: z.string().cuid("Invalid bounty ID"),
});

export const cancelBountySchema = z.object({
  bountyId: z.string().cuid("Invalid bounty ID"),
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must not exceed 500 characters")
    .trim(),
});

export const submitProofSchema = z.object({
  bountyId: z.string().cuid("Invalid bounty ID"),

  proofUrl: z.string().url("Must be a valid URL").min(1, "Proof URL is required"),

  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must not exceed 2000 characters")
    .trim(),
});

export const reviewProofSchema = z.object({
  proofId: z.string().cuid("Invalid proof ID"),

  approved: z.boolean(),

  feedback: z
    .string()
    .min(10, "Feedback must be at least 10 characters")
    .max(1000, "Feedback must not exceed 1000 characters")
    .trim()
    .optional(),
});

export const processPaymentSchema = z.object({
  bountyId: z.string().cuid("Invalid bounty ID"),

  lightningInvoice: z
    .string()
    .min(1, "Lightning invoice is required")
    .regex(/^ln[a-z0-9]+$/i, "Must be a valid Lightning invoice")
    .optional(),

  memo: z.string().max(500, "Memo must not exceed 500 characters").trim().optional(),
});

export const updatePaymentStatusSchema = z.object({
  bountyId: z.string().cuid("Invalid bounty ID"),

  status: z.enum(["COMPLETED", "FAILED"], {
    message: "Status must be either COMPLETED or FAILED",
  }),

  errorMessage: z
    .string()
    .max(500, "Error message must not exceed 500 characters")
    .trim()
    .optional(),

  paymentHash: z
    .string()
    .length(64, "Payment hash must be 64 characters")
    .regex(/^[a-f0-9]+$/i, "Payment hash must be hexadecimal")
    .optional(),

  preimage: z
    .string()
    .length(64, "Preimage must be 64 characters")
    .regex(/^[a-f0-9]+$/i, "Preimage must be hexadecimal")
    .optional(),
});

export const createCommentSchema = z.object({
  bountyId: z.string().cuid("Invalid bounty ID"),
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment must not exceed 2000 characters")
    .trim(),
});

export const updateCommentSchema = z.object({
  commentId: z.string().cuid("Invalid comment ID"),
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment must not exceed 2000 characters")
    .trim(),
});

export type CreateBountyInput = z.infer<typeof createBountySchema>;
export type UpdateBountyInput = z.infer<typeof updateBountySchema>;
export type ClaimBountyInput = z.infer<typeof claimBountySchema>;
export type UnclaimBountyInput = z.infer<typeof unclaimBountySchema>;
export type CompleteBountyInput = z.infer<typeof completeBountySchema>;
export type CancelBountyInput = z.infer<typeof cancelBountySchema>;
export type SubmitProofInput = z.infer<typeof submitProofSchema>;
export type ReviewProofInput = z.infer<typeof reviewProofSchema>;
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

// Bounty Request schemas
export const createBountyRequestSchema = z.object({
  message: z.string().max(1000, "Message must not exceed 1000 characters").trim().optional(),
});

export const reviewBountyRequestSchema = z.object({
  action: z.enum(["approve", "reject"], {
    message: "Action must be either 'approve' or 'reject'",
  }),
  reviewNote: z.string().max(500, "Review note must not exceed 500 characters").trim().optional(),
});

export type CreateBountyRequestInput = z.infer<typeof createBountyRequestSchema>;
export type ReviewBountyRequestInput = z.infer<typeof reviewBountyRequestSchema>;
