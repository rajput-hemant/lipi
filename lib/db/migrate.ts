import { migrate } from "drizzle-orm/postgres-js/migrator";

import { db } from ".";
import {
  assertLocalDevEnvironment,
  isLocalDevConfigured,
} from "../local-dev/fixture";
import { assertSharedAuthBaseline } from "../local-dev/preflight";
import {
  adoptLegacyLocalHistory,
  LIPI_MIGRATIONS_SCHEMA,
  LIPI_MIGRATIONS_TABLE,
} from "./migration-history";

const migrationsFolder = "lib/db/migrations";

const runMigrate = async () => {
  const local = isLocalDevConfigured();
  if (local) assertLocalDevEnvironment();

  console.log("⏳ Running migrations...");

  const start = Date.now();

  if (local) {
    await assertSharedAuthBaseline(db);
    const { adopted } = await adoptLegacyLocalHistory(db, migrationsFolder);
    if (adopted) console.log(`Adopted ${adopted} existing Lipi migration rows`);
    await migrate(db, {
      migrationsFolder,
      migrationsSchema: LIPI_MIGRATIONS_SCHEMA,
      migrationsTable: LIPI_MIGRATIONS_TABLE,
    });
  } else {
    await migrate(db, { migrationsFolder });
  }

  const end = Date.now();

  console.log("✅ Migrations completed in", end - start, "ms");

  process.exit(0);
};

runMigrate().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});
