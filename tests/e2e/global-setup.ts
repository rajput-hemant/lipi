import { execSync } from "node:child_process";

import type { FullConfig } from "@playwright/test";

import { applySharedAuthDatabase } from "./apply-shared-database";
import { applyLipiDatabase } from "./apply-lipi-database";
import {
  E2E_DATABASE_URL,
  E2E_PG_CONTAINER,
  E2E_PG_PORT,
} from "./env";

function run(command: string) {
  execSync(command, { stdio: "inherit" });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForPostgres() {
  const deadline = Date.now() + 60_000;
  return (async () => {
    while (Date.now() < deadline) {
      try {
        execSync(
          `docker exec ${E2E_PG_CONTAINER} pg_isready -U postgres -h 127.0.0.1`,
          { stdio: "ignore" }
        );
        return;
      } catch {
        await sleep(500);
      }
    }
    throw new Error("Postgres did not become ready in time");
  })();
}

export default async function globalSetup(_config: FullConfig) {
  try {
    run(`docker rm -f ${E2E_PG_CONTAINER} >/dev/null 2>&1 || true`);
    run(
      `docker run -d --rm --name ${E2E_PG_CONTAINER} -e POSTGRES_PASSWORD=test -p ${E2E_PG_PORT}:5432 --tmpfs /var/lib/postgresql postgres:18`
    );
    await waitForPostgres();

    applySharedAuthDatabase(E2E_DATABASE_URL, process.cwd());
    applyLipiDatabase(E2E_DATABASE_URL, process.cwd());
  } catch (error) {
    try {
      run(`docker stop ${E2E_PG_CONTAINER} >/dev/null 2>&1 || true`);
    } catch {
      // ignore cleanup failure
    }
    throw error;
  }
}
