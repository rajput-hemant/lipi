import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveAuthBaseURL } from "./resolve-auth-base-url";

const mocks = vi.hoisted(() => ({
  env: {} as Record<string, string | undefined>,
}));

vi.mock("@/lib/env", () => ({ env: mocks.env }));

describe("resolveAuthBaseURL", () => {
  afterEach(() => {
    for (const key of Object.keys(mocks.env)) delete mocks.env[key];
    vi.unstubAllEnvs();
  });

  it("uses configured BETTER_AUTH_URL when present", () => {
    mocks.env.BETTER_AUTH_URL = "https://auth.example";
    vi.stubEnv("SKIP_ENV_VALIDATION", "true");

    expect(resolveAuthBaseURL()).toBe("https://auth.example");
  });

  it("ignores the legacy AUTH_URL name", () => {
    mocks.env.AUTH_URL = "https://legacy.example";
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SKIP_ENV_VALIDATION", "false");

    expect(() => resolveAuthBaseURL()).toThrow(/BETTER_AUTH_URL/);
  });

  it("prefixes VERCEL_URL with https when no explicit auth URL is set", () => {
    mocks.env.VERCEL_URL = "lipi-preview.vercel.app";
    vi.stubEnv("SKIP_ENV_VALIDATION", "true");

    expect(resolveAuthBaseURL()).toBe("https://lipi-preview.vercel.app");
  });

  it("throws in validated production when no URL is configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SKIP_ENV_VALIDATION", "false");

    expect(() => resolveAuthBaseURL()).toThrow(/BETTER_AUTH_URL/);
  });

  it("allows localhost fallback in non-production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SKIP_ENV_VALIDATION", "true");

    expect(resolveAuthBaseURL()).toBe("http://localhost:3000");
  });
});
