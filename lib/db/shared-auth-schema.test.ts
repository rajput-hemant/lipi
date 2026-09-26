import { describe, expect, it } from "vitest";
import { getTableColumns, getTableName } from "drizzle-orm";

import snapshot from "./shared-auth-schema.snapshot.json";
import {
  accounts,
  betterAuthAccounts,
  betterAuthSessions,
  betterAuthVerifications,
  users,
  verificationTokens,
} from "./schema/auth";

const lipiSharedTables = {
  user: users,
  account: accounts,
  verificationToken: verificationTokens,
  better_auth_account: betterAuthAccounts,
  better_auth_session: betterAuthSessions,
  better_auth_verification: betterAuthVerifications,
} as const;

function columnKeys(table: (typeof lipiSharedTables)[keyof typeof lipiSharedTables]) {
  return Object.keys(getTableColumns(table)).sort();
}

describe("shared auth schema drift", () => {
  it("matches the Infinitunes vendored snapshot", () => {
    for (const [logicalName, table] of Object.entries(lipiSharedTables)) {
      const physicalName = getTableName(table);
      const snapshotEntry = snapshot.tables[physicalName as keyof typeof snapshot.tables];

      expect(snapshotEntry, `missing snapshot for ${physicalName}`).toBeDefined();
      expect(
        columnKeys(table),
        `column drift on ${logicalName} (${physicalName})`,
      ).toEqual([...snapshotEntry.columns].sort());
    }
  });
});
