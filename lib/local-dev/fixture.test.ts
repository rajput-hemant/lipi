import { describe, expect, it } from "vitest";

import {
  assertLocalDevEnvironment,
  isLocalDevConfigured,
  isLoopbackDatabaseUrl,
} from "./fixture";

const env = (values: Record<string, string | undefined>) =>
  values as unknown as NodeJS.ProcessEnv;

const local = env({
  LOCAL_DEV_CONFIG: "./fixture.json",
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
});

describe("local dev guards", () => {
  it("accepts only loopback database hosts", () => {
    expect(isLoopbackDatabaseUrl("postgresql://u:p@127.0.0.1:5432/db")).toBe(
      true
    );
    expect(isLoopbackDatabaseUrl("postgresql://u:p@[::1]:5432/db")).toBe(true);
    expect(isLoopbackDatabaseUrl("postgresql://u:p@db.example.com/db")).toBe(
      false
    );
    expect(isLoopbackDatabaseUrl(undefined)).toBe(false);
  });

  it("is opt-in through LOCAL_DEV_CONFIG", () => {
    expect(isLocalDevConfigured(env({}))).toBe(false);
    expect(isLocalDevConfigured(local)).toBe(true);
  });

  it("refuses production, remote databases and a missing config", () => {
    expect(() => assertLocalDevEnvironment(local)).not.toThrow();
    expect(() =>
      assertLocalDevEnvironment(env({ ...local, NODE_ENV: "production" }))
    ).toThrow(/production/);
    expect(() =>
      assertLocalDevEnvironment(
        env({ ...local, DATABASE_URL: "postgresql://u:p@prod.example.com/db" })
      )
    ).toThrow(/localhost/);
    expect(() =>
      assertLocalDevEnvironment(env({ DATABASE_URL: local.DATABASE_URL }))
    ).toThrow(/LOCAL_DEV_CONFIG/);
  });
});
