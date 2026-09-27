import { execSync } from "node:child_process";

import type { FullConfig } from "@playwright/test";

import { E2E_PG_CONTAINER } from "./env";

export default async function globalTeardown(_config: FullConfig) {
  try {
    execSync(`docker stop ${E2E_PG_CONTAINER}`, { stdio: "inherit" });
  } catch {
    execSync(`docker rm -f ${E2E_PG_CONTAINER} >/dev/null 2>&1 || true`, {
      stdio: "ignore",
      shell: "/bin/bash",
    });
  }
}
