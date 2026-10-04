import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from ".";
import {
  CREDENTIAL_PROVIDER_ID,
  credentialAccountWhere,
} from "../auth/credential-account";
import { requireLocalDatabaseUrl } from "./database-url";
import { loadLocalDevCredentials } from "./local-dev-credentials";
import { betterAuthAccounts, documents, users, workspaces } from "./schema";
import { LOCAL_DOCUMENTS, LOCAL_WORKSPACE } from "./seed-data";

async function seed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed with NODE_ENV=production");
  }
  requireLocalDatabaseUrl(process.env.DATABASE_URL);
  const { user } = loadLocalDevCredentials();

  await db.transaction(async (tx) => {
    const byEmail = await tx.query.users.findFirst({
      where: eq(users.email, user.email),
    });
    if (byEmail && byEmail.id !== user.id) {
      throw new Error(
        `A user with ${user.email} already exists with a different id; refusing to overwrite. Reset the local database.`
      );
    }

    await tx
      .insert(users)
      .values({
        id: user.id,
        email: user.email,
        name: user.name,
        betterAuthName: user.name,
        emailVerifiedBoolean: true,
      })
      .onConflictDoNothing();

    const credential = await tx.query.betterAuthAccounts.findFirst({
      where: credentialAccountWhere(user.id),
    });
    if (!credential) {
      const password = await hash(user.password, 10);
      await tx
        .insert(betterAuthAccounts)
        .values({
          userId: user.id,
          providerId: CREDENTIAL_PROVIDER_ID,
          accountId: user.id,
          password,
        })
        .onConflictDoNothing();
      await tx.update(users).set({ password }).where(eq(users.id, user.id));
    }

    await tx
      .insert(workspaces)
      .values({ ...LOCAL_WORKSPACE, workspaceOwnerId: user.id })
      .onConflictDoNothing();

    // Parents are listed before children, so insertion order satisfies the FK.
    for (const document of LOCAL_DOCUMENTS) {
      await tx
        .insert(documents)
        .values({ ...document, workspaceId: LOCAL_WORKSPACE.id })
        .onConflictDoNothing();
    }
  });

  console.log(`Seeded local user ${user.email} and workspace data`);
  await db.$client.end({ timeout: 5 });
}

seed().catch(async (error) => {
  console.error("Seed failed:", error);
  await db.$client.end({ timeout: 5 }).catch(() => undefined);
  process.exit(1);
});
