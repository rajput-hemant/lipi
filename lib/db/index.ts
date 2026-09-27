import { pgTableCreator } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { assertDatabaseUrlConfigured } from "./database-url";
import * as schema from "./schema";
import { lipiTableName } from "./table-prefix";

const databaseUrl = process.env.DATABASE_URL;
assertDatabaseUrlConfigured(databaseUrl);

// NOTE: postgres versions above 3.3.5 are not supported on the edge runtime
const client = postgres(databaseUrl ?? "postgresql://localhost:5432/lipi", {
  max: 1,
});

export const db = drizzle(client, { schema });

/**
 * Use the same database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator(lipiTableName);
