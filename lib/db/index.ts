import { pgTableCreator } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { siteConfig } from "@/config/site";
import { env } from "@/lib/env.mjs";
import * as schema from "./schema";

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
