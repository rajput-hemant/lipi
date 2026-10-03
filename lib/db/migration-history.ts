import { sql } from "drizzle-orm";
import { readMigrationFiles } from "drizzle-orm/migrator";

import type { db as Db } from ".";

export const LIPI_MIGRATIONS_SCHEMA = "drizzle";
export const LIPI_MIGRATIONS_TABLE = "__lipi_migrations";

type HistoryRow = { hash: string; created_at: string | number };

export type HistoryAdoption =
  | { action: "none" }
  | { action: "copy"; rows: HistoryRow[] }
  | { action: "ambiguous"; lipi: number; foreign: number };

/**
 * Decides how rows already in the default history table relate to Lipi.
 * Only rows whose hash matches a Lipi migration file are ever copied.
 */
export function classifyDefaultHistory(
  rows: HistoryRow[],
  lipiHashes: Set<string>
): HistoryAdoption {
  const lipi = rows.filter((row) => lipiHashes.has(row.hash));
  const foreign = rows.length - lipi.length;

  if (!lipi.length) return { action: "none" };
  if (foreign) return { action: "ambiguous", lipi: lipi.length, foreign };
  return { action: "copy", rows: lipi };
}

export const AMBIGUOUS_HISTORY_MESSAGE = (lipi: number, foreign: number) =>
  `drizzle.__drizzle_migrations mixes ${lipi} Lipi and ${foreign} foreign migration rows. ` +
  "Refusing to adopt automatically. Reset the local database " +
  "(docs/local-development.md, 'Safe reset'), then migrate Infinitunes first and Lipi second.";

/**
 * Local shared-database mode keeps Lipi's history in drizzle.__lipi_migrations so
 * Infinitunes migration timestamps cannot make Drizzle skip Lipi migrations.
 * Rows in the default table are never modified or deleted.
 */
export async function adoptLegacyLocalHistory(
  database: typeof Db,
  migrationsFolder: string
) {
  const [{ exists }] = (await database.execute(
    sql`SELECT to_regclass(${`${LIPI_MIGRATIONS_SCHEMA}.${LIPI_MIGRATIONS_TABLE}`}) IS NOT NULL AS exists`
  )) as unknown as [{ exists: boolean }];
  if (exists) return { adopted: 0 };

  const [{ legacy }] = (await database.execute(
    sql`SELECT to_regclass('drizzle.__drizzle_migrations') IS NOT NULL AS legacy`
  )) as unknown as [{ legacy: boolean }];
  if (!legacy) return { adopted: 0 };

  const rows = (await database.execute(
    sql`SELECT hash, created_at FROM drizzle.__drizzle_migrations`
  )) as unknown as HistoryRow[];
  const lipiHashes = new Set(
    readMigrationFiles({ migrationsFolder }).map((m) => m.hash)
  );
  const plan = classifyDefaultHistory([...rows], lipiHashes);

  if (plan.action === "ambiguous") {
    throw new Error(AMBIGUOUS_HISTORY_MESSAGE(plan.lipi, plan.foreign));
  }
  if (plan.action === "none") return { adopted: 0 };

  await database.transaction(async (tx) => {
    await tx.execute(sql`CREATE SCHEMA IF NOT EXISTS drizzle`);
    await tx.execute(
      sql`CREATE TABLE IF NOT EXISTS drizzle.__lipi_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)`
    );
    for (const row of plan.rows) {
      await tx.execute(
        sql`INSERT INTO drizzle.__lipi_migrations (hash, created_at) VALUES (${row.hash}, ${row.created_at})`
      );
    }
  });

  return { adopted: plan.rows.length };
}
