import { execSync } from "node:child_process";

import { E2E_PG_CONTAINER } from "./env";

/**
 * Apply Lipi application tables (lipi_*) on the throwaway e2e database.
 *
 * Local and production use `drizzle-kit migrate` (`bun run db:migrate`). For e2e we sync the current Drizzle
 * schema via Kit push (tablesFilter lipi_*), which is faster than replaying the
 * migration chain and matches its end state.
 */
export function applyLipiDatabase(databaseUrl: string, repoRoot: string) {
  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    SKIP_ENV_VALIDATION: "true",
  };

  // Kit push does not create extensions; the documents trigram indexes need it.
  execSync(
    `docker exec ${E2E_PG_CONTAINER} psql -U postgres -h 127.0.0.1 -c "CREATE EXTENSION IF NOT EXISTS pg_trgm"`,
    { stdio: "inherit" }
  );

  console.log("⏳ Pushing Lipi schema (lipi_* via drizzle-lipi e2e config)…");
  execSync(
    "bunx drizzle-kit push --force --config tests/e2e/drizzle-lipi.config.ts",
    {
      stdio: "inherit",
      env,
      cwd: repoRoot,
    }
  );
  console.log("✅ Lipi schema pushed");
}
