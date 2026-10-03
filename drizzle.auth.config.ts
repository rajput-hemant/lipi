import { cwd } from "process";
import { loadEnvConfig } from "@next/env";

import type { Config } from "drizzle-kit";

import { requireLocalDatabaseUrl } from "@/lib/db/database-url";

loadEnvConfig(cwd());

export default {
  schema: "./lib/db/schema/auth.ts",
  out: "./lib/db/auth-migrations",
  dialect: "postgresql",
  dbCredentials: { url: requireLocalDatabaseUrl(process.env.DATABASE_URL) },
  migrations: { table: "__lipi_auth_migrations", schema: "drizzle" },
} satisfies Config;
