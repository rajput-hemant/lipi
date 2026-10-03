import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      ...configDefaults.exclude,
      ".next/**",
      ".claude/worktrees/**",
      ".opencode/**",
      "tests/e2e/**",
    ],
    env: {
      SKIP_ENV_VALIDATION: "true",
      DISABLE_AUTH_RATE_LIMIT: "true",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
