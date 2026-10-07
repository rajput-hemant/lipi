import { sql } from "drizzle-orm";

import type { PendingInviteRef } from "@/lib/billing/enforce-quotas";

import { assertUserCanAddCollaborator } from "@/lib/billing/enforce-quotas";
import { userHasProPlanEntitlement } from "@/lib/billing/quota-entitlement";
import { db } from "@/lib/db";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function withOwnerCollaboratorLock<T>(
  ownerId: string,
  work: (
    transaction: Transaction,
    assertQuota: (invite?: PendingInviteRef) => Promise<void>
  ) => Promise<T>
): Promise<T> {
  const isPro = await userHasProPlanEntitlement(ownerId);

  return db.transaction(async (transaction) => {
    await transaction.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${ownerId}, 0))`
    );
    const assertQuota = (invite?: PendingInviteRef) =>
      assertUserCanAddCollaborator(ownerId, invite, {
        database: transaction,
        isPro,
      });
    return work(transaction, assertQuota);
  });
}
