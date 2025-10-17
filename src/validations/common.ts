import { z } from "zod";

export const slugSchema = z
  .string()
  .min(1, "Slug cannot be empty")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format");

export const uuidSchema = z.string().uuid("Invalid UUID");

export const urlSchema = z.string().url("Invalid URL");
