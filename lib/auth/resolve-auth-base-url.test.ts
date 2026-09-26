import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveAuthBaseURL } from "./resolve-auth-base-url";

describe("resolveAuthBaseURL", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllEnvs();
  });

  it("uses configured BETTER_AUTH_URL when present", () => {
    process.env.BETTER_AUTH_URL = "https://auth.example";
    process.env.SKIP_ENV_VALIDATION = "true";

    expect(resolveAuthBaseURL()).toBe("https://auth.example");
  });

  it("prefixes VERCEL_URL with https when no explicit auth URL is set", () => {
    vi.stubEnv("BETTER_AUTH_URL", "");
    vi.stubEnv("AUTH_URL", "");
    vi.stubEnv("VERCEL_URL", "lipi-preview.vercel.app");
    vi.stubEnv("SKIP_ENV_VALIDATION", "true");

    expect(resolveAuthBaseURL()).toBe("https://lipi-preview.vercel.app");
  });

  it("throws in validated production when no URL is configured", () => {
    vi.stubEnv("BETTER_AUTH_URL", "");
    vi.stubEnv("AUTH_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SKIP_ENV_VALIDATION", "false");

    expect(() => resolveAuthBaseURL()).toThrow(/AUTH_URL/);
  });

  it("allows localhost fallback in non-production", () => {
    vi.stubEnv("BETTER_AUTH_URL", "");
    vi.stubEnv("AUTH_URL", "");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SKIP_ENV_VALIDATION", "true");

    expect(resolveAuthBaseURL()).toBe("http://localhost:3000");
  });
});
