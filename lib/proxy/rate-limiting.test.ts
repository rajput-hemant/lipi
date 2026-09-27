import { afterEach, describe, expect, it, vi } from "vitest";

import { getProxyRateLimitMode } from "./rate-limiting";

describe("getProxyRateLimitMode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("disables rate limiting outside production", () => {
    vi.stubEnv("ENABLE_RATE_LIMITING", "true");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");

    expect(getProxyRateLimitMode()).toBe("disabled");
  });

  it("disables rate limiting when ENABLE_RATE_LIMITING is not true", () => {
    vi.stubEnv("ENABLE_RATE_LIMITING", "false");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");

    expect(getProxyRateLimitMode()).toBe("disabled");
  });

  it("fails closed when production rate limiting is enabled without redis", () => {
    vi.stubEnv("ENABLE_RATE_LIMITING", "true");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    expect(getProxyRateLimitMode()).toBe("misconfigured");
  });

  it("activates rate limiting when production redis env is present", () => {
    vi.stubEnv("ENABLE_RATE_LIMITING", "true");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");

    expect(getProxyRateLimitMode()).toBe("active");
  });
});
