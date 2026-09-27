import { defineConfig } from "@playwright/test";

import {
  E2E_APP_ORIGIN,
  E2E_APP_PORT,
  E2E_REALTIME_PORT,
  e2eProcessEnv,
} from "./tests/e2e/env";

const e2eEnv = e2eProcessEnv();

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: "list",
  timeout: 120_000,
  expect: { timeout: 30_000 },
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  use: {
    baseURL: E2E_APP_ORIGIN,
    trace: "retain-on-failure",
    headless: true,
  },
  webServer: [
    {
      command: "bun run realtime:start",
      port: E2E_REALTIME_PORT,
      timeout: 120_000,
      reuseExistingServer: false,
      env: e2eEnv,
    },
    {
      command: `bun run build && bunx next start --port ${E2E_APP_PORT} --hostname 127.0.0.1`,
      url: E2E_APP_ORIGIN,
      timeout: 300_000,
      reuseExistingServer: false,
      env: e2eEnv,
    },
  ],
});
