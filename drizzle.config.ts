import { cwd } from "process";
import { loadEnvConfig } from "@next/env";

import type { Config } from "drizzle-kit";

import { LIPI_TABLE_PREFIX } from "@/lib/db/table-prefix";

loadEnvConfig(cwd());

export default {
  schema: "./lib/db/schema",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  verbose: true,
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/lipi",
  },
  tablesFilter: [`${LIPI_TABLE_PREFIX}_*`],
} satisfies Config;
