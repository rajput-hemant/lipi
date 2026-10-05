import { NextRequest } from "next/server";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { proxy } from "@/proxy";

describe("proxy rate limiting gate", () => {
  const originalEnv = {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  };

  beforeAll(() => {
    process.env.BETTER_AUTH_SECRET =
      "test-secret-key-that-is-at-least-32-chars";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
  });

  afterAll(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    vi.stubEnv(
      "BETTER_AUTH_SECRET",
      "test-secret-key-that-is-at-least-32-chars"
    );
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
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
