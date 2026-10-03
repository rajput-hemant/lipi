import { sql } from "drizzle-orm";

import type { db as Db } from "../db";

export function sharedAuthBaselineProblem(present: {
  user: boolean;
  betterAuthAccount: boolean;
}) {
  if (present.user && present.betterAuthAccount) return null;

  return (
    'The shared auth tables ("user", better_auth_account, ...) are missing. ' +
    "Infinitunes owns them: run its `bun run db:migrate` first, then rerun this command (docs/local-development.md)."
  );
}

export async function assertSharedAuthBaseline(database: typeof Db) {
  const [row] = (await database.execute(
    sql`SELECT to_regclass('public."user"') IS NOT NULL AS "user", to_regclass('public.better_auth_account') IS NOT NULL AS "betterAuthAccount"`
  )) as unknown as [{ user: boolean; betterAuthAccount: boolean }];

  const problem = sharedAuthBaselineProblem(row);
  if (problem) throw new Error(problem);
}
