import { pgTableCreator } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/env";
import * as schema from "./schema";
import { assertDatabaseUrlConfigured } from "./database-url";
import { lipiTableName } from "./table-prefix";

assertDatabaseUrlConfigured(env.DATABASE_URL);

// NOTE: postgres versions above 3.3.5 are not supported on the edge runtime
const client = postgres(
  env.DATABASE_URL ?? "postgresql://localhost:5432/lipi",
  { max: 1 },
);

export const db = drizzle(client, { schema });

/**
 * Use the same database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator(lipiTableName);
