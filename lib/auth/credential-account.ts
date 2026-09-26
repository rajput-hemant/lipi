import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { betterAuthAccounts } from "@/lib/db/schema";

export const CREDENTIAL_PROVIDER_ID = "credential";

export function credentialAccountWhere(userId: string) {
  return and(
    eq(betterAuthAccounts.userId, userId),
    eq(betterAuthAccounts.providerId, CREDENTIAL_PROVIDER_ID),
  );
}

export function resolveStoredPasswordHash(
  credentialPassword: string | null | undefined,
  legacyUserPassword: string | null | undefined,
) {
  return credentialPassword ?? legacyUserPassword ?? null;
}

export async function findCredentialAccount(userId: string) {
  return db.query.betterAuthAccounts.findFirst({
    where: credentialAccountWhere(userId),
  });
}

export async function upsertCredentialPassword(userId: string, hashedPassword: string) {
  const existing = await findCredentialAccount(userId);

  if (existing) {
    await db
      .update(betterAuthAccounts)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(betterAuthAccounts.id, existing.id));
    return;
  }

  await db.insert(betterAuthAccounts).values({
    userId,
    providerId: CREDENTIAL_PROVIDER_ID,
    accountId: userId,
    password: hashedPassword,
  });
}
