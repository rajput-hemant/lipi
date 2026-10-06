import { sql as sqlTag } from "drizzle-orm";
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

  it("lets two instances race to fill the last free seat only once", async () => {
    const { owner, workspace } = await ownerWithOneCollaborator();

    const attempt = async ({ lock, schema }: Instance) => {
      const newUser = await fixtures.user("invitee");
      return lock(owner, async (transaction, assertQuota) => {
        await assertQuota();
        await transaction.execute(sqlTag`select pg_sleep(0.4)`);
        await transaction
          .insert(schema.collaborators)
          .values({ workspaceId: workspace, userId: newUser });
      });
    };

    const results = await Promise.allSettled(instances.map(attempt));

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((r) => r.status === "rejected");
    expect(rejected).toMatchObject({
      reason: { name: "MutationAuthError" },
    });
    expect(await collaboratorCount(workspace)).toBe(2);
  });

  it("overshoots the free limit when the same race runs without the lock", async () => {
    const { owner, workspace } = await ownerWithOneCollaborator();

    const attempt = async ({ db, quotas, schema }: Instance) => {
      const newUser = await fixtures.user("invitee");
      return db.transaction(async (transaction) => {
        await quotas.assertUserCanAddCollaborator(owner, undefined, {
          database: transaction,
          isPro: false,
        });
        await transaction.execute(sqlTag`select pg_sleep(0.4)`);
        await transaction
          .insert(schema.collaborators)
          .values({ workspaceId: workspace, userId: newUser });
      });
    };

    const results = await Promise.allSettled(instances.map(attempt));

    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    expect(await collaboratorCount(workspace)).toBe(3);
  });

  it("does not serialize owners against each other", async () => {
    const first = await ownerWithOneCollaborator();
    const second = await ownerWithOneCollaborator();
    const windows: { start: number; end: number }[] = [];

    await Promise.all(
      [first, second].map(({ owner }, index) =>
        instances[index].lock(owner, async (transaction) => {
          const start = Date.now();
          await transaction.execute(sqlTag`select pg_sleep(0.5)`);
          windows.push({ start, end: Date.now() });
        })
      )
    );

    const [a, b] = windows;
    expect(a.start).toBeLessThan(b.end);
    expect(b.start).toBeLessThan(a.end);
  });
});
