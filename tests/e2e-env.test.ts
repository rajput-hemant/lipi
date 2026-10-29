import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// stubEnv restores the caller's own E2E_* values after each test.
beforeEach(() => {
  for (const name of [
    "E2E_PG_CONTAINER",
    "E2E_PG_PORT",
    "E2E_APP_PORT",
    "E2E_REALTIME_PORT",
  ]) {
    vi.stubEnv(name, undefined);
  }
});
afterEach(() => vi.unstubAllEnvs());

describe("e2e env overrides", () => {
  it("defaults to the checked-in ports", async () => {
    vi.resetModules();
    const env = await import("./e2e/env");

    expect(env.E2E_PG_CONTAINER).toBe("lipi-p9-e2e-pg");
    expect(env.E2E_PG_PORT).toBe(5544);
    expect(env.E2E_APP_PORT).toBe(3100);
    expect(env.E2E_REALTIME_PORT).toBe(1235);
    expect(env.E2E_APP_ORIGIN).toBe("http://127.0.0.1:3100");
  });

  it("reads ports from the environment for private runs", async () => {
    process.env.E2E_PG_CONTAINER = "lipi-private-pg";
    process.env.E2E_PG_PORT = "55454";
    process.env.E2E_APP_PORT = "3114";
    process.env.E2E_REALTIME_PORT = "1254";
    vi.resetModules();
    const env = await import("./e2e/env");

    expect(env.E2E_PG_CONTAINER).toBe("lipi-private-pg");
    expect(env.E2E_PG_PORT).toBe(55454);
    expect(env.E2E_APP_PORT).toBe(3114);
    expect(env.E2E_REALTIME_PORT).toBe(1254);
    expect(env.E2E_APP_ORIGIN).toBe("http://127.0.0.1:3114");
    expect(env.E2E_DATABASE_URL).toContain("55454");
  });
});
