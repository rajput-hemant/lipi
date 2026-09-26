import { describe, expect, it } from "vitest";

import snapshot from "./shared-auth-schema.snapshot.json";
import {
  accounts,
  betterAuthAccounts,
  betterAuthSessions,
  betterAuthVerifications,
  users,
  verificationTokens,
} from "./schema/auth";
import { serializeSharedAuthTables } from "./shared-auth-schema.serialize";

const lipiSharedTables = {
  user: users,
  account: accounts,
  verificationToken: verificationTokens,
  better_auth_account: betterAuthAccounts,
  better_auth_session: betterAuthSessions,
  better_auth_verification: betterAuthVerifications,
} as const;

describe("shared auth schema drift", () => {
  it("matches the Infinitunes vendored snapshot metadata", () => {
    const live = serializeSharedAuthTables(lipiSharedTables);

    expect(live).toEqual({
      tables: snapshot.tables,
    });
  });
});
