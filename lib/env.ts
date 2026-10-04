import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

import { isEnvValidationSkipped } from "./env-flags";

const isProduction = process.env.NODE_ENV === "production";

function requiredInProduction(message: string) {
  return isProduction ? z.string().min(1, { message }) : z.string().optional();
}

export const env = createEnv({
  skipValidation: isEnvValidationSkipped(),

  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    BETTER_AUTH_SECRET:
      isProduction ?
        z.string().min(1, { message: "Auth secret is invalid or missing" })
      : z.string().optional(),

    BETTER_AUTH_URL: z.string().url().optional(),

    GOOGLE_CLIENT_ID: requiredInProduction(
      "Google Client ID is invalid or missing"
    ),
    GOOGLE_CLIENT_SECRET: requiredInProduction(
      "Google Client Secret is invalid or missing"
    ),

    GITHUB_CLIENT_ID: requiredInProduction(
      "Github Client ID is invalid or missing"
    ),
    GITHUB_CLIENT_SECRET: requiredInProduction(
      "Github Client Secret is invalid or missing"
    ),
    GITHUB_ACCESS_TOKEN: z.string().optional(),

    DATABASE_URL: z
      .string()
      .min(1, { message: "Database URL is invalid or missing" })
      .optional()
      .superRefine((value, ctx) => {
        if (
          process.env.NODE_ENV === "production" &&
          !isEnvValidationSkipped() &&
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
    TRUSTED_PROXY_COUNT: z.coerce.number().int().min(0).default(0),
    DISABLE_AUTH_RATE_LIMIT: z
      .enum(["true", "false"])
      .optional()
      .superRefine((value, ctx) => {
        if (process.env.NODE_ENV === "production" && value === "true") {
          ctx.addIssue({
            code: "custom",
            message: "Auth rate limiting cannot be disabled in production",
          });
        }
      }),

    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_PRICE_ID_PRO: z.string().optional(),

    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().optional(),

    UPLOADTHING_TOKEN: z.string().optional(),
    UPLOADTHING_SECRET: z.string().optional(),
    UPLOADTHING_APP_ID: z.string().optional(),

    // Hosting platform variables
    VERCEL: z.string().optional(),
    VERCEL_URL: z.string().optional(),
    PORT: z.coerce.number().int().positive().optional(),

    // Read directly from process.env by the standalone realtime process
    // (realtime/server.ts), which cannot load t3-env; declared here so the
    // values are still validated and documented on the Next side.
    LIPI_REALTIME_ALLOWED_ORIGINS: z.string().optional(),
    LIPI_REALTIME_PORT: z.coerce.number().int().min(1).max(65535).optional(),
    LIPI_REALTIME_ADDRESS: z.string().optional(),
  },

  client: {
    NEXT_PUBLIC_LIPI_REALTIME_URL: z.string().optional(),
    NEXT_PUBLIC_VERCEL_ENV: z.string().optional(),
    NEXT_PUBLIC_VERCEL_BRANCH_URL: z.string().optional(),
  },

  // Client variables must be referenced literally so Next inlines them.
  experimental__runtimeEnv: {
    NEXT_PUBLIC_LIPI_REALTIME_URL: process.env.NEXT_PUBLIC_LIPI_REALTIME_URL,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
    NEXT_PUBLIC_VERCEL_BRANCH_URL: process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL,
  },

  emptyStringAsUndefined: true,
});
