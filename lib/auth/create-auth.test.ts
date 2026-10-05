import { compare, hash } from "bcryptjs";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  betterAuthAccounts,
  betterAuthSessions,
  betterAuthVerifications,
  users,
} from "@/lib/db/schema";
import { createAuth } from "./create-auth";

const TEST_SECRET = vi.hoisted(
  () => "test-secret-key-that-is-at-least-32-chars"
);

vi.mock("@/lib/env", () => ({
  env: { BETTER_AUTH_SECRET: TEST_SECRET, DISABLE_AUTH_RATE_LIMIT: "true" },
}));

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

describe("Better Auth configuration", () => {
  const originalEnv = {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    SKIP_ENV_VALIDATION: process.env.SKIP_ENV_VALIDATION,
    DISABLE_AUTH_RATE_LIMIT: process.env.DISABLE_AUTH_RATE_LIMIT,
  };

  beforeAll(() => {
    process.env.BETTER_AUTH_SECRET = TEST_SECRET;
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    process.env.SKIP_ENV_VALIDATION = "true";
    process.env.DISABLE_AUTH_RATE_LIMIT = "true";
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

  it("signs with the validated env secret", () => {
    expect(createAuth(makeFakeDb()).options.secret).toBe(TEST_SECRET);
  });

  it("disables implicit account linking", () => {
    const auth = createAuth(makeFakeDb());
    expect(auth.options.account?.accountLinking?.enabled).toBe(false);
    expect(auth.options.account?.accountLinking?.disableImplicitLinking).toBe(
      true
    );
  });

  it("maps Better Auth fields to shared user columns", () => {
    const auth = createAuth(makeFakeDb());
    expect(auth.options.user?.fields?.name).toBe("betterAuthName");
    expect(auth.options.user?.fields?.emailVerified).toBe(
      "emailVerifiedBoolean"
    );
  });

  it("enables the emailed reset flow with a 1 hour token and session revocation", () => {
    const options = createAuth(makeFakeDb()).options.emailAndPassword;
    expect(options?.sendResetPassword).toBeTypeOf("function");
    expect(options?.resetPasswordTokenExpiresIn).toBe(3600);
    expect(options?.revokeSessionsOnPasswordReset).toBe(true);
  });

  it("uses uuid ids for shared user primary keys", () => {
    const auth = createAuth(makeFakeDb());
    expect(auth.options.advanced?.database?.generateId).toBe("uuid");
  });

  it("disables rate limiting only when DISABLE_AUTH_RATE_LIMIT is set", () => {
    const auth = createAuth(makeFakeDb());
    expect(auth.options.rateLimit?.enabled).toBe(false);
  });

  it("configures bcrypt password hashing", async () => {
    const auth = createAuth(makeFakeDb());
    const passwordConfig = auth.options.emailAndPassword?.password;
    expect(passwordConfig?.hash).toBeTypeOf("function");
    expect(passwordConfig?.verify).toBeTypeOf("function");

    const hashed = await passwordConfig!.hash!("hunter2");
    expect(
      await passwordConfig!.verify!({ password: "hunter2", hash: hashed })
    ).toBe(true);
    expect(
      await passwordConfig!.verify!({ password: "wrong", hash: hashed })
    ).toBe(false);
    expect(await compare("hunter2", hashed)).toBe(true);
  });

  it("proves import-time BETTER_AUTH_SECRET wiring using isolated modules", async () => {
    const customSecret = "isolated-test-secret-key-32-chars-long";
    const priorSecret = process.env.BETTER_AUTH_SECRET;
    try {
      process.env.BETTER_AUTH_SECRET = customSecret;
      vi.resetModules();
      const { createAuth: isolatedCreateAuth } = await import("./create-auth");
      const auth = isolatedCreateAuth(makeFakeDb());
      expect(auth.options.secret).toBe(customSecret);
    } finally {
      if (priorSecret === undefined) {
        delete process.env.BETTER_AUTH_SECRET;
      } else {
        process.env.BETTER_AUTH_SECRET = priorSecret;
      }
      vi.resetModules();
    }
  });
});
