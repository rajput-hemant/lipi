import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { proxy } from "@/proxy";

describe("proxy rate limiting gate", () => {
  beforeEach(() => {
    vi.stubEnv(
      "BETTER_AUTH_SECRET",
      "test-secret-key-that-is-at-least-32-chars"
    );
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 503 when production rate limiting is enabled without redis", async () => {
    vi.stubEnv("ENABLE_RATE_LIMITING", "true");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const req = new NextRequest("http://localhost:3000/dashboard");
    const res = await proxy(req);

    expect(res.status).toBe(503);
  });
});
