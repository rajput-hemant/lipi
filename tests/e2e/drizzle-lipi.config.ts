import type { Config } from "drizzle-kit";

/**
 * E2E-only: push Lipi application tables without re-creating shared auth DDL.
 */
export default {
  schema: ["./lib/db/schema/app.ts", "./lib/db/schema/enums.ts"],
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:test@127.0.0.1:5544/postgres",
  },
  tablesFilter: ["lipi_*"],
} satisfies Config;
