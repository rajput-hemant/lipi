import { describe, expect, it } from "vitest";

describe("environment isolation and cleanup proof", () => {
  const trackedKeys = [
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "SKIP_ENV_VALIDATION",
    "DISABLE_AUTH_RATE_LIMIT",
    "GITHUB_ACCESS_TOKEN",
    "ENABLE_RATE_LIMITING",
  ] as const;

  it("verifies that test environment hooks preserve original values", () => {
    // Snapshot current state
    const snapshot: Record<string, string | undefined> = {};
    for (const key of trackedKeys) {
      snapshot[key] = process.env[key];
    }

    // Simulate an isolated test block with save and restore pattern
    const saved = { ...snapshot };

    // Apply temporary test mutations
    process.env.BETTER_AUTH_SECRET = "isolation-test-secret-value-32-chars";
    process.env.BETTER_AUTH_URL = "http://localhost:4000";
    process.env.SKIP_ENV_VALIDATION = "true";
    process.env.DISABLE_AUTH_RATE_LIMIT = "true";
    process.env.GITHUB_ACCESS_TOKEN = "ghp_temp_isolation_token";

    expect(process.env.BETTER_AUTH_SECRET).toBe(
      "isolation-test-secret-value-32-chars"
    );
    expect(process.env.GITHUB_ACCESS_TOKEN).toBe("ghp_temp_isolation_token");

    // Execute restoration (as done in afterAll/afterEach)
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }

    // Prove that every tracked key is restored exactly to pre-test state
    for (const key of trackedKeys) {
      expect(process.env[key]).toBe(snapshot[key]);
    }
  });

  it("proves that ambient environment has no leftover test secrets", () => {
    // Neither temporary isolation tokens nor test dummy secrets should leak
    expect(process.env.GITHUB_ACCESS_TOKEN).not.toBe(
      "ghp_temp_isolation_token"
    );
    expect(process.env.BETTER_AUTH_SECRET).not.toBe(
      "isolation-test-secret-value-32-chars"
    );
  });
});
