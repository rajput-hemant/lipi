import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  createTestClient,
  createTestFixtures,
  resolveTestDatabaseUrl,
} from "@/lib/db/test-database";

const testDatabaseUrl = await resolveTestDatabaseUrl();

vi.mock("@/lib/env", () => ({ env: {} }));

type Instance = {
  lock: typeof import("./workspace-member-quota").withOwnerCollaboratorLock;
  quotas: typeof import("@/lib/billing/enforce-quotas");
  schema: typeof import("@/lib/db/schema");
  db: typeof import("@/lib/db").db;
};

// Each app instance owns a single-connection client, so two separately
// evaluated module graphs stand in for two server processes.
async function loadInstance(): Promise<Instance> {
  vi.resetModules();
  const [lock, quotas, schema, { db }] = await Promise.all([
    import("./workspace-member-quota"),
    import("@/lib/billing/enforce-quotas"),
    import("@/lib/db/schema"),
    import("@/lib/db"),
  ]);
  return { lock: lock.withOwnerCollaboratorLock, quotas, schema, db };
}

function createBarrier(parties: number) {
  let arrived = 0;
  const open = Promise.withResolvers<void>();
  return () => {
    if (++arrived === parties) open.resolve();
    return open.promise;
  };
}

describe.skipIf(!testDatabaseUrl)("owner collaborator advisory lock", () => {
  const sql = createTestClient(testDatabaseUrl!);
  const fixtures = createTestFixtures(sql);
  const instances: Instance[] = [];

  beforeAll(async () => {
    process.env.DATABASE_URL = testDatabaseUrl!;
    instances.push(await loadInstance(), await loadInstance());
  });

  afterAll(async () => {
    await fixtures.cleanup();
    await sql.end({ timeout: 1 });
    for (const { db } of instances) {
      await (db.$client as { end: () => Promise<void> }).end();
    }
  });

  async function ownerWithOneCollaborator() {
    const owner = await fixtures.user("owner");
    const workspace = await fixtures.workspace(owner);
    await fixtures.collaborator(workspace, await fixtures.user("member"));
    return { owner, workspace };
  }

  async function collaboratorCount(workspace: string) {
    const [row] = await sql`
      select count(*)::int as value from lipi_collaborators where workspace_id = ${workspace}`;
    return row.value as number;
  }

  async function untilAdvisoryLockWaiter() {
    for (;;) {
      const waiting = await sql`
        select 1 from pg_locks where locktype = 'advisory' and not granted`;
      if (waiting.length) return;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  it("lets two instances race to fill the last free seat only once", async () => {
    const { owner, workspace } = await ownerWithOneCollaborator();
    const [firstInvitee, secondInvitee] = [
      await fixtures.user("invitee"),
      await fixtures.user("invitee"),
    ];
    const holderChecked = Promise.withResolvers<void>();
    const releaseHolder = Promise.withResolvers<void>();

    const holder = instances[0].lock(
      owner,
      async (transaction, assertQuota) => {
        await assertQuota();
        holderChecked.resolve();
        await releaseHolder.promise;
        await transaction
          .insert(instances[0].schema.collaborators)
          .values({ workspaceId: workspace, userId: firstInvitee });
      }
    );
    await holderChecked.promise;

    const contender = instances[1].lock(
      owner,
      async (transaction, assertQuota) => {
        await assertQuota();
        await transaction
          .insert(instances[1].schema.collaborators)
          .values({ workspaceId: workspace, userId: secondInvitee });
      }
    );
    await untilAdvisoryLockWaiter();
    releaseHolder.resolve();

    const results = await Promise.allSettled([holder, contender]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results[0].status).toBe("fulfilled");
    expect(results[1]).toMatchObject({
      status: "rejected",
      reason: { name: "MutationAuthError" },
    });
    expect(await collaboratorCount(workspace)).toBe(2);
  });

  it("overshoots the free limit when the same race runs without the lock", async () => {
    const { owner, workspace } = await ownerWithOneCollaborator();
    const invitees = [
      await fixtures.user("invitee"),
      await fixtures.user("invitee"),
    ];
    const bothChecked = createBarrier(2);

    const results = await Promise.allSettled(
      instances.map(({ db, quotas, schema }, index) =>
        db.transaction(async (transaction) => {
          await quotas.assertUserCanAddCollaborator(owner, undefined, {
            database: transaction,
            isPro: false,
          });
          await bothChecked();
          await transaction
            .insert(schema.collaborators)
            .values({ workspaceId: workspace, userId: invitees[index] });
        })
      )
    );

    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    expect(await collaboratorCount(workspace)).toBe(3);
  });

  it("does not serialize owners against each other", async () => {
    const first = await ownerWithOneCollaborator();
    const second = await ownerWithOneCollaborator();
    const bothInside = createBarrier(2);

    await Promise.all(
      [first, second].map(({ owner }, index) =>
        instances[index].lock(owner, async () => {
          await bothInside();
        })
      )
    );
  });
});
