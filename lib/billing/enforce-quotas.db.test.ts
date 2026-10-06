import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  createTestClient,
  createTestFixtures,
  resolveTestDatabaseUrl,
} from "@/lib/db/test-database";

const testDatabaseUrl = await resolveTestDatabaseUrl();

const mocks = vi.hoisted(() => ({
  env: { STRIPE_PRICE_ID_PRO: "price_pro_test" },
}));

vi.mock("@/lib/env", () => ({ env: mocks.env }));

const days = (count: number) => new Date(Date.now() + count * 86_400_000);

describe.skipIf(!testDatabaseUrl)("plan quota SQL against Postgres", () => {
  const sql = createTestClient(testDatabaseUrl!);
  const fixtures = createTestFixtures(sql);
  let quotas: typeof import("./enforce-quotas");

  beforeAll(async () => {
    process.env.DATABASE_URL = testDatabaseUrl!;
    quotas = await import("./enforce-quotas");
  });

  afterAll(async () => {
    await fixtures.cleanup();
    await sql.end({ timeout: 1 });
    const { db } = await import("@/lib/db");
    await (db.$client as { end: () => Promise<void> }).end();
  });

  it("counts only the owner's active workspaces", async () => {
    const owner = await fixtures.user("owner");
    const other = await fixtures.user("other");
    await fixtures.workspace(owner);
    await fixtures.workspace(owner, { inTrash: true });
    await fixtures.workspace(other);

    expect(await quotas.countOwnedWorkspaces(owner)).toBe(1);
  });

  it("blocks a second workspace on the free plan but ignores trashed ones", async () => {
    const owner = await fixtures.user("owner");
    await fixtures.workspace(owner, { inTrash: true });
    await expect(
      quotas.assertUserCanCreateWorkspace(owner)
    ).resolves.toBeUndefined();

    await fixtures.workspace(owner);
    await expect(
      quotas.assertUserCanCreateWorkspace(owner)
    ).rejects.toMatchObject({ name: "PlanQuotaError", code: "workspace" });
  });

  it("lets a subscriber on the configured price own several workspaces", async () => {
    const owner = await fixtures.user("pro");
    await fixtures.subscription(owner, "price_pro_test");
    await fixtures.workspace(owner);
    await fixtures.workspace(owner);

    await expect(
      quotas.assertUserCanCreateWorkspace(owner)
    ).resolves.toBeUndefined();
  });

  it("does not treat another price or an inactive status as Pro", async () => {
    const wrongPrice = await fixtures.user("price");
    await fixtures.subscription(wrongPrice, "price_other");
    await fixtures.workspace(wrongPrice);
    await expect(
      quotas.assertUserCanCreateWorkspace(wrongPrice)
    ).rejects.toMatchObject({ code: "workspace" });

    const canceled = await fixtures.user("canceled");
    await fixtures.subscription(canceled, "price_pro_test", "canceled");
    await fixtures.workspace(canceled);
    await expect(
      quotas.assertUserCanCreateWorkspace(canceled)
    ).rejects.toMatchObject({ code: "workspace" });
  });

  it("counts collaborators across every workspace the owner holds", async () => {
    const owner = await fixtures.user("owner");
    const first = await fixtures.workspace(owner);
    const second = await fixtures.workspace(owner);
    const a = await fixtures.user("a");
    const b = await fixtures.user("b");
    const c = await fixtures.user("c");
    await fixtures.collaborator(first, a);
    await fixtures.collaborator(second, b);

    expect(await quotas.countCollaboratorsForOwner(owner)).toBe(2);
    await expect(
      quotas.assertUserCanAddCollaborator(owner)
    ).rejects.toMatchObject({ name: "PlanQuotaError", code: "collaborator" });

    const roomy = await fixtures.user("roomy");
    const roomyWorkspace = await fixtures.workspace(roomy);
    await fixtures.collaborator(roomyWorkspace, c);
    await expect(
      quotas.assertUserCanAddCollaborator(roomy)
    ).resolves.toBeUndefined();
  });

  it("counts unexpired pending invites but not expired ones", async () => {
    const owner = await fixtures.user("owner");
    const workspace = await fixtures.workspace(owner);
    await fixtures.collaborator(workspace, await fixtures.user("member"));
    await fixtures.invite(workspace, owner, "expired@example.test", days(-1));
    const target = { workspaceId: workspace, email: "new@example.test" };

    await expect(
      quotas.assertUserCanAddCollaborator(owner, target)
    ).resolves.toBeUndefined();

    await fixtures.invite(workspace, owner, "pending@example.test", days(1));
    await expect(
      quotas.assertUserCanAddCollaborator(owner, target)
    ).rejects.toMatchObject({ code: "collaborator" });
  });

  it("does not count the invite being reissued for the same email", async () => {
    const owner = await fixtures.user("owner");
    const workspace = await fixtures.workspace(owner);
    await fixtures.collaborator(workspace, await fixtures.user("member"));
    await fixtures.invite(workspace, owner, "again@example.test", days(1));

    await expect(
      quotas.assertUserCanAddCollaborator(owner, {
        workspaceId: workspace,
        email: "again@example.test",
      })
    ).resolves.toBeUndefined();
  });

  it("lets a free new owner receive a workspace only while the total stays within two", async () => {
    const oldOwner = await fixtures.user("old");
    const newOwner = await fixtures.user("new");
    const workspace = await fixtures.workspace(oldOwner);
    await fixtures.collaborator(workspace, newOwner);
    await fixtures.collaborator(workspace, await fixtures.user("a"));

    await expect(
      quotas.assertUserCanReceiveWorkspaceTransfer(newOwner, workspace)
    ).resolves.toBeUndefined();

    await fixtures.collaborator(workspace, await fixtures.user("b"));
    await expect(
      quotas.assertUserCanReceiveWorkspaceTransfer(newOwner, workspace)
    ).rejects.toMatchObject({ code: "collaborator" });
  });
});
