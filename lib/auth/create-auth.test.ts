import { compare, hash } from "bcryptjs";
import { beforeAll, describe, expect, it } from "vitest";

import {
  betterAuthAccounts,
  betterAuthSessions,
  betterAuthVerifications,
  users,
} from "@/lib/db/schema";
import { createAuth } from "./create-auth";

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
  beforeAll(() => {
    process.env.BETTER_AUTH_SECRET =
      "test-secret-key-that-is-at-least-32-chars";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    process.env.SKIP_ENV_VALIDATION = "true";
    process.env.DISABLE_AUTH_RATE_LIMIT = "true";
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
});
