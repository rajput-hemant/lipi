import { afterEach, describe, expect, it, vi } from "vitest";

import {
  assertDatabaseUrlConfigured,
  isLoopbackDatabaseUrl,
  requireLocalDatabaseUrl,
} from "./database-url";

describe("assertDatabaseUrlConfigured", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws in validated production when DATABASE_URL is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SKIP_ENV_VALIDATION", "false");

    expect(() => assertDatabaseUrlConfigured(undefined)).toThrow(
      /DATABASE_URL is not set/
    );
  });

  it("throws in development instead of falling back to the OS user", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SKIP_ENV_VALIDATION", "false");

    expect(() => assertDatabaseUrlConfigured(undefined)).toThrow(
      /\.env\.local/
    );
  });

  it("allows a missing URL when validation is skipped or under test", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SKIP_ENV_VALIDATION", "true");
    expect(() => assertDatabaseUrlConfigured(undefined)).not.toThrow();

    vi.stubEnv("SKIP_ENV_VALIDATION", "false");
    vi.stubEnv("NODE_ENV", "test");
    expect(() => assertDatabaseUrlConfigured(undefined)).not.toThrow();
  });
});

describe("local database url", () => {
  it("recognizes loopback hosts only", () => {
    expect(isLoopbackDatabaseUrl("postgresql://u:p@127.0.0.1:5432/d")).toBe(
      true
    );
    expect(isLoopbackDatabaseUrl("postgresql://u:p@db.example.com/d")).toBe(
      false
    );
    expect(isLoopbackDatabaseUrl(undefined)).toBe(false);
  });

  it("rejects a missing or remote url", () => {
    expect(() => requireLocalDatabaseUrl(undefined)).toThrow(
      /DATABASE_URL is not set/
    );
    expect(() =>
      requireLocalDatabaseUrl("postgresql://u:p@db.example.com/d")
    ).toThrow(/localhost/);
  });
});
