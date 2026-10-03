import { execSync } from "node:child_process";

const AUTH_CONFIG = "tests/e2e/drizzle-auth.config.ts";

/** Push the auth tables (user, account, better_auth_*) onto the throwaway e2e database. */
export function applyAuthDatabase(databaseUrl: string, repoRoot: string) {
  console.log("⏳ Pushing auth schema (drizzle-kit)…");
  execSync(`bunx drizzle-kit push --force --config ${AUTH_CONFIG}`, {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      SKIP_ENV_VALIDATION: "true",
    },
    cwd: repoRoot,
  });
  console.log("✅ Auth schema pushed");
}
