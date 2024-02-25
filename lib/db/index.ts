import { pgTableCreator } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { siteConfig } from "@/config/site";
import { env } from "@/lib/env";
import * as schema from "./schema";

// NOTE: postgres versions above 3.3.5 are not supported on the edge runtime
const client = postgres(env.DATABASE_URL, { max: 1 });

export const db = drizzle(client, { schema });

/**
 * Use the same database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator(
  (name) => `${siteConfig.name.toLowerCase().replace(/\s/g, "_")}_${name}`
);
