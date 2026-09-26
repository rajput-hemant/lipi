import { afterEach, describe, expect, it, vi } from "vitest";

import { assertDatabaseUrlConfigured } from "./database-url";

describe("assertDatabaseUrlConfigured", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws in validated production when DATABASE_URL is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SKIP_ENV_VALIDATION", "false");

    expect(() => assertDatabaseUrlConfigured(undefined)).toThrow(
      /Database URL/,
    );
  });

  it("allows missing DATABASE_URL in development", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(() => assertDatabaseUrlConfigured(undefined)).not.toThrow();
  });
});
