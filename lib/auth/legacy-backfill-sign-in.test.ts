import { hash } from "bcryptjs";
import { describe, expect, it, vi } from "vitest";

import {
  betterAuthAccounts,
  betterAuthSessions,
  betterAuthVerifications,
  users,
} from "@/lib/db/schema";
import { createAuth } from "./create-auth";
import { CREDENTIAL_PROVIDER_ID } from "./credential-account";

const TEST_SECRET = vi.hoisted(
  () => "test-secret-key-that-is-at-least-32-chars"
);

vi.mock("@/lib/env", () => ({
  env: { BETTER_AUTH_SECRET: TEST_SECRET },
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
  it("accepts bcrypt passwords on backfilled credential accounts", async () => {
    const auth = createAuth(makeFakeDb());
    expect(auth.options.secret).toBe(TEST_SECRET);
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
