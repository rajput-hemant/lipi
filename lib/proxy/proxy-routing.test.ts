import { NextRequest } from "next/server";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { config, proxy } from "@/proxy";

const mocks = vi.hoisted(() => ({
  hasValidProxySession: vi.fn(),
  limit: vi.fn(),
}));

vi.mock("@/lib/auth/proxy-session", () => ({
  hasValidProxySession: mocks.hasValidProxySession,
}));

vi.mock("@upstash/redis", () => ({
  Redis: { fromEnv: () => ({}) },
}));

vi.mock("@upstash/ratelimit", () => {
  class Ratelimit {
    static slidingWindow = () => ({});
    limit = mocks.limit;
  }
  return { Ratelimit };
});

describe("proxy routing", () => {
  beforeAll(() => {
    vi.stubEnv("SKIP_ENV_VALIDATION", "true");
  });

  afterEach(() => {
    mocks.hasValidProxySession.mockReset();
    mocks.limit.mockReset();
    vi.unstubAllEnvs();
    vi.stubEnv("SKIP_ENV_VALIDATION", "true");
  });

  it("serves public routes without checking the session", async () => {
    const res = await proxy(new NextRequest("http://localhost:3000/pricing"));

    expect(res.status).toBe(200);
    expect(mocks.hasValidProxySession).not.toHaveBeenCalled();
  });

  it("lets authenticated users through protected routes", async () => {
    mocks.hasValidProxySession.mockResolvedValue(true);

    const res = await proxy(
      new NextRequest("http://localhost:3000/dashboard/ws-1")
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("preserves the query string in the login redirect", async () => {
    mocks.hasValidProxySession.mockResolvedValue(false);

    const res = await proxy(
      new NextRequest("http://localhost:3000/dashboard?tab=billing&x=1")
    );

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/login?from=%2Fdashboard%3Ftab%3Dbilling%26x%3D1"
    );
  });

  it("returns 429 with rate limit headers when the limiter rejects", async () => {
    vi.stubEnv("ENABLE_RATE_LIMITING", "true");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    mocks.limit.mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      pending: Promise.resolve(),
      reset: Date.now() + 1000,
    });

    const res = await proxy(
      new NextRequest("http://localhost:3000/pricing", {
        headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
      })
    );

    expect(res.status).toBe(429);
    expect(res.headers.get("x-ratelimit-limit")).toBe("10");
    expect(res.headers.get("x-ratelimit-remaining")).toBe("0");
    expect(mocks.limit).toHaveBeenCalledWith("203.0.113.7");
  });

  it("matcher skips static assets, _next and auth api routes", () => {
    const matcher = new RegExp(`^${config.matcher[0]}$`);

    expect(matcher.test("/dashboard")).toBe(true);
    expect(matcher.test("/logo.png")).toBe(false);
    expect(matcher.test("/_next/static/x")).toBe(false);
    expect(matcher.test("/api/auth/session")).toBe(false);
  });
});
