import { hash } from "bcryptjs";
import { beforeAll, describe, expect, it } from "vitest";

import {
  betterAuthAccounts,
  betterAuthSessions,
  betterAuthVerifications,
  users,
} from "@/lib/db/schema";
import { createAuth } from "./create-auth";
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

/** Shape produced by Infinitunes BACKFILL_CREDENTIAL_ACCOUNTS (packages/db/src/backfill.ts). */
export function infinitunesBackfillCredentialRow(
  userId: string,
  passwordHash: string
) {
  return {
    userId,
    accountId: userId,
    providerId: CREDENTIAL_PROVIDER_ID,
    password: passwordHash,
  };
}

describe("legacy credential backfill sign-in", () => {
  beforeAll(() => {
    process.env.BETTER_AUTH_SECRET =
      "test-secret-key-that-is-at-least-32-chars";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    process.env.SKIP_ENV_VALIDATION = "true";
  });

  it("accepts bcrypt passwords on backfilled credential accounts", async () => {
    const auth = createAuth(makeFakeDb());
    const password = "LegacyPass1!";
    const passwordHash = await hash(password, 10);
    const row = infinitunesBackfillCredentialRow(
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
