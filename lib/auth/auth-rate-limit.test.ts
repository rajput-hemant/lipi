import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveAuthRateLimitEnabled } from "./auth-rate-limit";

const mocks = vi.hoisted(() => ({
  env: {} as { DISABLE_AUTH_RATE_LIMIT?: string },
}));

vi.mock("@/lib/env", () => ({ env: mocks.env }));

describe("resolveAuthRateLimitEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("leaves Better Auth defaults when no test override is set", () => {
    vi.stubEnv("NODE_ENV", "test");
    mocks.env.DISABLE_AUTH_RATE_LIMIT = undefined;

    expect(resolveAuthRateLimitEnabled()).toBeUndefined();
  });

  it("disables auth rate limiting only outside production", () => {
    vi.stubEnv("NODE_ENV", "test");
    mocks.env.DISABLE_AUTH_RATE_LIMIT = "true";

    expect(resolveAuthRateLimitEnabled()).toBe(false);
  });

  it("ignores disable flag in production so auth throttling stays on", () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.env.DISABLE_AUTH_RATE_LIMIT = "true";

    expect(resolveAuthRateLimitEnabled()).toBeUndefined();
  });
});
