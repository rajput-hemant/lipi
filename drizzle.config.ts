import { cwd } from "process";
import { loadEnvConfig } from "@next/env";

import type { Config } from "drizzle-kit";

import {
  isLoopbackDatabaseUrl,
  requireDatabaseUrl,
} from "@/lib/db/database-url";
import { LIPI_TABLE_PREFIX } from "@/lib/db/table-prefix";

loadEnvConfig(cwd());

const url = requireDatabaseUrl(process.env.DATABASE_URL);

export default {
  schema: "./lib/db/schema",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  verbose: true,
  dbCredentials: { url },
  tablesFilter: [`${LIPI_TABLE_PREFIX}_*`],
  ...(isLoopbackDatabaseUrl(url) && {
    migrations: { table: "__lipi_migrations", schema: "drizzle" },
  }),
} satisfies Config;
