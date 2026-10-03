import type { Config } from "drizzle-kit";

/**
 * E2E-only Drizzle Kit config for the auth tables (user, account, better_auth_*).
 * The main drizzle.config.ts filters to lipi_*.
 */
export default {
  schema: "./lib/db/schema/auth.ts",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:test@127.0.0.1:5544/postgres",
  },
} satisfies Config;
