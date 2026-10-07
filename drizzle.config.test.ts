import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@next/env", () => ({ loadEnvConfig: vi.fn() }));

const HISTORY = { table: "__lipi_migrations", schema: "drizzle" };

async function loadConfig(url: string) {
  vi.resetModules();
  vi.stubEnv("DATABASE_URL", url);
  return (await import("./drizzle.config")).default;
}

describe("drizzle.config", () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each([
    "postgresql://u:p@localhost:5432/lipi",
    "postgresql://u:p@127.0.0.1:5432/lipi",
    "postgresql://u:p@db.example.com:5432/lipi",
  ])("uses the Lipi history table for %s", async (url) => {
    expect((await loadConfig(url)).migrations).toEqual(HISTORY);
  });
});
