import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { betterAuthAccounts } from "@/lib/db/schema";

export const CREDENTIAL_PROVIDER_ID = "credential";

export function credentialAccountWhere(userId: string) {
  return and(
    eq(betterAuthAccounts.userId, userId),
    eq(betterAuthAccounts.providerId, CREDENTIAL_PROVIDER_ID)
  );
}
