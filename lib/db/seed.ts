import { hash } from "bcryptjs";
import { and, eq } from "drizzle-orm";

import { db } from ".";
import { CREDENTIAL_PROVIDER_ID } from "../auth/credential-account";
import {
  assertLocalDevEnvironment,
  loadLocalDevFixture,
} from "../local-dev/fixture";
import { betterAuthAccounts, documents, users, workspaces } from "./schema";
import { LOCAL_DOCUMENTS, LOCAL_WORKSPACE } from "./seed-data";

async function seed() {
  assertLocalDevEnvironment();
  const { user } = loadLocalDevFixture();

  await db.transaction(async (tx) => {
    const byEmail = await tx.query.users.findFirst({
      where: eq(users.email, user.email),
    });
    if (byEmail && byEmail.id !== user.id) {
      throw new Error(
        `A user with ${user.email} already exists with a different id; refusing to overwrite. Reset the local database or change the fixture.`
      );
    }

    await tx
      .insert(users)
      .values({
        id: user.id,
        email: user.email,
        name: user.name,
        betterAuthName: user.name,
        username: user.username,
        displayUsername: user.displayUsername ?? user.username,
        emailVerified: user.emailVerified ? new Date() : null,
        emailVerifiedBoolean: user.emailVerified,
      })
      .onConflictDoNothing();

    const credential = await tx.query.betterAuthAccounts.findFirst({
      where: and(
        eq(betterAuthAccounts.userId, user.id),
        eq(betterAuthAccounts.providerId, CREDENTIAL_PROVIDER_ID)
      ),
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
  console.error("Seed failed:", error instanceof Error ? error.message : error);
  await db.$client.end({ timeout: 5 }).catch(() => undefined);
  process.exit(1);
});
