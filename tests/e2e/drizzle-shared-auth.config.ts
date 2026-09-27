import type { Config } from "drizzle-kit";

/**
 * E2E-only Drizzle Kit config for shared auth tables (user, account, better_auth_*).
 * Lipi's main drizzle.config.ts filters to lipi_*; Infinitunes owns unprefixed auth DDL.
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
