import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

import { ensureHttpsUrl } from "@/lib/auth/ensure-https-url";

const isProduction = process.env.NODE_ENV === "production";

function requiredInProduction(message: string) {
  return isProduction ?
      z.string().min(1, { message })
    : z.string().optional();
}

export const env = createEnv({
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    AUTH_SECRET:
      isProduction ?
        z.string().min(1, { message: "Auth secret is invalid or missing" })
      : z.string().optional(),

    AUTH_URL: z.preprocess(
      (str) => ensureHttpsUrl(process.env.VERCEL_URL) ?? str,
      process.env.VERCEL ? z.string() : z.string().url().optional(),
    ),

    BETTER_AUTH_SECRET: z.string().optional(),
    BETTER_AUTH_URL: z.string().url().optional(),

    GOOGLE_CLIENT_ID: requiredInProduction(
      "Google Client ID is invalid or missing",
    ),
    GOOGLE_CLIENT_SECRET: requiredInProduction(
      "Google Client Secret is invalid or missing",
    ),

    GITHUB_CLIENT_ID: requiredInProduction(
      "Github Client ID is invalid or missing",
    ),
    GITHUB_CLIENT_SECRET: requiredInProduction(
      "Github Client Secret is invalid or missing",
    ),
    GITHUB_ACCESS_TOKEN: z.string().optional(),

    DATABASE_URL: z
      .string()
      .min(1, { message: "Database URL is invalid or missing" })
      .optional()
      .superRefine((value, ctx) => {
        if (
          process.env.NODE_ENV === "production" &&
          process.env.SKIP_ENV_VALIDATION !== "true" &&
          !value
        ) {
          ctx.addIssue({
            code: "custom",
            message: "Database URL is invalid or missing",
          });
        }
      }),

    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    ENABLE_RATE_LIMITING: z.enum(["true", "false"]).default("false"),
    RATE_LIMITING_REQUESTS_PER_SECOND: z.coerce.number().default(50),
  },

  client: {},

  experimental__runtimeEnv: {},

  emptyStringAsUndefined: true,
});
