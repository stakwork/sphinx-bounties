import { z } from "zod";

export const loginSchema = z.object({
  pubkey: z
    .string()
    .length(66, "Invalid pubkey format")
    .regex(/^[0-9a-f]{66}$/i, "Invalid pubkey format"),

  signature: z.string().min(1, "Signature is required"),

  challenge: z.string().min(1, "Challenge is required"),
});

export const registerSchema = z.object({
  pubkey: z
    .string()
    .length(66, "Invalid pubkey format")
    .regex(/^[0-9a-f]{66}$/i, "Invalid pubkey format"),

  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must not exceed 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .trim(),

  alias: z
    .string()
    .min(2, "Alias must be at least 2 characters")
    .max(50, "Alias must not exceed 50 characters")
    .trim()
    .optional(),

  signature: z.string().min(1, "Signature is required"),

  challenge: z.string().min(1, "Challenge is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const logoutSchema = z.object({
  everywhere: z.boolean().default(false),
});

export const getChallengeSchema = z.object({
  pubkey: z
    .string()
    .length(66, "Invalid pubkey format")
    .regex(/^[0-9a-f]{66}$/i, "Invalid pubkey format"),
});

export const verifySignatureSchema = z.object({
  pubkey: z
    .string()
    .length(66, "Invalid pubkey format")
    .regex(/^[0-9a-f]{66}$/i, "Invalid pubkey format"),

  signature: z.string().min(1, "Signature is required"),

  message: z.string().min(1, "Message is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type GetChallengeInput = z.infer<typeof getChallengeSchema>;
export type VerifySignatureInput = z.infer<typeof verifySignatureSchema>;
