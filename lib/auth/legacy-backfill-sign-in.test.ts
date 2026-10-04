import { hash } from "bcryptjs";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { createAuth } from "./create-auth";

import {
  betterAuthAccounts,
  betterAuthSessions,
  betterAuthVerifications,
  users,
} from "@/lib/db/schema";
import { CREDENTIAL_PROVIDER_ID } from "./credential-account";

function makeFakeDb() {
  const query: Record<string, unknown> = {
    users,
    betterAuthAccounts,
    betterAuthSessions,
    betterAuthVerifications,
  };
  return {
    query,
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
    _: { fullSchema: query },
  } as unknown as Parameters<typeof createAuth>[0];
}

/** Credential row shape a legacy-user backfill inserts. */
export function backfilledCredentialRow(userId: string, passwordHash: string) {
  return {
    userId,
    accountId: userId,
    providerId: CREDENTIAL_PROVIDER_ID,
    password: passwordHash,
  };
}

describe("legacy credential backfill sign-in", () => {
  const originalEnv = {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    SKIP_ENV_VALIDATION: process.env.SKIP_ENV_VALIDATION,
  };

  beforeAll(() => {
    process.env.BETTER_AUTH_SECRET =
      "test-secret-key-that-is-at-least-32-chars";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    process.env.SKIP_ENV_VALIDATION = "true";
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

  it("accepts bcrypt passwords on backfilled credential accounts", async () => {
    vi.resetModules();
    const { createAuth: isolatedCreateAuth } = await import("./create-auth");
    const auth = isolatedCreateAuth(makeFakeDb());
    expect(auth.options.secret).toBe(
      "test-secret-key-that-is-at-least-32-chars"
    );

    const password = "LegacyPass1!";
    const passwordHash = await hash(password, 10);
    const row = backfilledCredentialRow(
      "11111111-1111-4111-8111-111111111111",
      passwordHash
    );

    expect(row.accountId).toBe(row.userId);
    expect(row.providerId).toBe("credential");

    const verify = auth.options.emailAndPassword?.password?.verify;
    expect(verify).toBeTypeOf("function");
    expect(await verify!({ password, hash: row.password })).toBe(true);
  });
});
