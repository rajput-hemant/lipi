import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveAuthRateLimitEnabled } from "./auth-rate-limit";

describe("resolveAuthRateLimitEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("leaves Better Auth defaults when no test override is set", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("DISABLE_AUTH_RATE_LIMIT", "");

    expect(resolveAuthRateLimitEnabled()).toBeUndefined();
  });

  it("disables auth rate limiting only outside production", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("DISABLE_AUTH_RATE_LIMIT", "true");

    expect(resolveAuthRateLimitEnabled()).toBe(false);
  });

  it("ignores disable flag in production so auth throttling stays on", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DISABLE_AUTH_RATE_LIMIT", "true");

    expect(resolveAuthRateLimitEnabled()).toBeUndefined();
  });
});
