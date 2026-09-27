import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const SHARED_AUTH_CONFIG = "tests/e2e/drizzle-shared-auth.config.ts";

function infinitunesDbRoot(): string | null {
  const root = process.env.E2E_INFINITUNES_ROOT ?? process.env.INFINITUNES_ROOT;
  if (!root) return null;
  const pkgDb = join(root, "packages/db");
  if (!existsSync(pkgDb)) return null;
  return pkgDb;
}

function runInfinitunesMigrations(pkgDb: string, databaseUrl: string) {
  const migrateTs = join(pkgDb, "src/migrate.ts");
  const migrateJs = join(pkgDb, "migrate.ts");
  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    SKIP_ENV_VALIDATION: "true",
  };

  if (existsSync(migrateTs)) {
    execSync("bun src/migrate.ts", { stdio: "inherit", env, cwd: pkgDb });
    return;
  }
  if (existsSync(migrateJs)) {
    execSync("bun migrate.ts", { stdio: "inherit", env, cwd: pkgDb });
    return;
  }

  try {
    execSync("bun run db:migrate", { stdio: "inherit", env, cwd: pkgDb });
    return;
  } catch {
    // fall through to push
  }

  const pushConfig = join(pkgDb, "drizzle.config.ts");
  if (existsSync(pushConfig)) {
    execSync("bunx drizzle-kit push --force", {
      stdio: "inherit",
      env,
      cwd: pkgDb,
    });
    return;
  }

  throw new Error(
    `INFINITUNES_ROOT set (${pkgDb}) but no migrate script or drizzle.config.ts found`
  );
}

/**
 * Shared DB contract: apply Infinitunes-owned auth DDL before Lipi lipi_* migrations.
 * Prefer Infinitunes migrations when E2E_INFINITUNES_ROOT / INFINITUNES_ROOT is set;
 * otherwise push lib/db/schema/auth.ts via Drizzle Kit (throwaway DB only).
 */
export function applySharedAuthDatabase(databaseUrl: string, repoRoot: string) {
  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    SKIP_ENV_VALIDATION: "true",
  };

  const pkgDb = infinitunesDbRoot();
  if (pkgDb) {
    console.log("⏳ Applying Infinitunes shared-table migrations…");
    runInfinitunesMigrations(pkgDb, databaseUrl);
    console.log("✅ Infinitunes shared auth schema ready");
    return;
  }

  console.log(
    "⏳ Pushing shared auth schema (drizzle-kit; set E2E_INFINITUNES_ROOT for Infinitunes migrations)…"
  );
  execSync(`bunx drizzle-kit push --force --config ${SHARED_AUTH_CONFIG}`, {
    stdio: "inherit",
    env,
    cwd: repoRoot,
  });
  console.log("✅ Shared auth schema pushed");
}
