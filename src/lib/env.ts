import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRY_HOURS: z.coerce.number().default(168),
    REDIS_URL: z.string().url().optional().or(z.literal("")),
    SUPER_ADMINS: z.string().optional().or(z.literal("")),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRY_HOURS: process.env.JWT_EXPIRY_HOURS,
    REDIS_URL: process.env.REDIS_URL,
    SUPER_ADMINS: process.env.SUPER_ADMINS,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
