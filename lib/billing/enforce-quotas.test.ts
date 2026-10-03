import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  assertUserCanAddCollaborator,
  assertUserCanCreateWorkspace,
  assertUserCanReceiveWorkspaceTransfer,
} from "./enforce-quotas";
import { PlanQuotaError } from "./errors";

const mocks = vi.hoisted(() => ({
  env: {} as { STRIPE_PRICE_ID_PRO?: string },
  getCurrentBillingSubscription: vi.fn(),
  rows: [] as { value: number }[][],
}));

vi.mock("@/lib/env", () => ({ env: mocks.env }));

vi.mock("./subscription-access", () => ({
  getCurrentBillingSubscription: mocks.getCurrentBillingSubscription,
}));

vi.mock("@/lib/db", () => {
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "from", "innerJoin"]) {
    chain[method] = () => chain;
  }
  chain.where = () => Promise.resolve(mocks.rows.shift() ?? [{ value: 0 }]);
  return { db: chain };
});

vi.mock("@/lib/db/schema", () => ({
  collaborators: {},
  workspaceInvites: {},
  workspaces: {},
}));

const proSubscription = { status: "active", priceId: "price_pro" };

describe("plan quota enforcement", () => {
  beforeEach(() => {
    mocks.rows = [];
    mocks.getCurrentBillingSubscription.mockReset();
    mocks.env.STRIPE_PRICE_ID_PRO = "price_pro";
  });

  afterEach(() => {
    mocks.env.STRIPE_PRICE_ID_PRO = undefined;
  });

  it("blocks a second workspace on the free plan", async () => {
    mocks.getCurrentBillingSubscription.mockResolvedValue(null);
    mocks.rows = [[{ value: 1 }]];

    await expect(assertUserCanCreateWorkspace("u1")).rejects.toMatchObject({
      name: "PlanQuotaError",
      code: "workspace",
    });
  });

  it("allows the first workspace on the free plan", async () => {
    mocks.getCurrentBillingSubscription.mockResolvedValue(null);
    mocks.rows = [[{ value: 0 }]];

    await expect(assertUserCanCreateWorkspace("u1")).resolves.toBeUndefined();
  });

  it("allows unlimited workspaces for pro subscribers", async () => {
    mocks.getCurrentBillingSubscription.mockResolvedValue(proSubscription);
    mocks.rows = [[{ value: 10 }]];

    await expect(assertUserCanCreateWorkspace("u1")).resolves.toBeUndefined();
  });

  it("blocks the third collaborator on the free plan", async () => {
    mocks.getCurrentBillingSubscription.mockResolvedValue(null);
    mocks.rows = [[{ value: 2 }]];

    const error = await assertUserCanAddCollaborator("u1").catch(
      (e: unknown) => e
    );
    expect(error).toBeInstanceOf(PlanQuotaError);
    expect((error as PlanQuotaError).code).toBe("collaborator");
  });

  it("counts other pending invites toward the free collaborator limit", async () => {
    mocks.getCurrentBillingSubscription.mockResolvedValue(null);
    mocks.rows = [[{ value: 1 }], [{ value: 1 }]];

    await expect(
      assertUserCanAddCollaborator("u1", { workspaceId: "w1", email: "a@b.c" })
    ).rejects.toBeInstanceOf(PlanQuotaError);
  });

  it("allows an invite when members plus pending invites stay under the limit", async () => {
    mocks.getCurrentBillingSubscription.mockResolvedValue(null);
    mocks.rows = [[{ value: 1 }], [{ value: 0 }]];

    await expect(
      assertUserCanAddCollaborator("u1", { workspaceId: "w1", email: "a@b.c" })
    ).resolves.toBeUndefined();
  });

  it("ignores pending invites when no invite is being issued", async () => {
    mocks.getCurrentBillingSubscription.mockResolvedValue(null);
    mocks.rows = [[{ value: 1 }], [{ value: 5 }]];

    await expect(assertUserCanAddCollaborator("u1")).resolves.toBeUndefined();
  });

  it("treats a pro subscription as free when the pro price is unconfigured", async () => {
    mocks.env.STRIPE_PRICE_ID_PRO = undefined;
    mocks.getCurrentBillingSubscription.mockResolvedValue(proSubscription);
    mocks.rows = [[{ value: 2 }]];

    await expect(assertUserCanAddCollaborator("u1")).rejects.toBeInstanceOf(
      PlanQuotaError
    );
  });

  it("does not grant pro to a canceled subscription", async () => {
    mocks.getCurrentBillingSubscription.mockResolvedValue({
      status: "canceled",
      priceId: "price_pro",
    });
    mocks.rows = [[{ value: 2 }]];

    await expect(assertUserCanAddCollaborator("u1")).rejects.toBeInstanceOf(
      PlanQuotaError
    );
  });

  describe("workspace transfer", () => {
    // rows: [other collaborators in this workspace], [new owner's collaborators]
    it("rejects a free new owner when the result exceeds the limit", async () => {
      mocks.getCurrentBillingSubscription.mockResolvedValue(null);
      mocks.rows = [[{ value: 2 }], [{ value: 0 }]];

      await expect(
        assertUserCanReceiveWorkspaceTransfer("u2", "w1")
      ).rejects.toMatchObject({ name: "PlanQuotaError", code: "collaborator" });
    });

    it("counts collaborators in workspaces the new owner already owns", async () => {
      mocks.getCurrentBillingSubscription.mockResolvedValue(null);
      mocks.rows = [[{ value: 1 }], [{ value: 1 }]];

      await expect(
        assertUserCanReceiveWorkspaceTransfer("u2", "w1")
      ).rejects.toBeInstanceOf(PlanQuotaError);
    });

    it("allows a free new owner within the limit", async () => {
      mocks.getCurrentBillingSubscription.mockResolvedValue(null);
      mocks.rows = [[{ value: 1 }], [{ value: 0 }]];

      await expect(
        assertUserCanReceiveWorkspaceTransfer("u2", "w1")
      ).resolves.toBeUndefined();
    });

    it("allows a pro new owner regardless of size", async () => {
      mocks.getCurrentBillingSubscription.mockResolvedValue(proSubscription);
      mocks.rows = [[{ value: 10 }], [{ value: 10 }]];

      await expect(
        assertUserCanReceiveWorkspaceTransfer("u2", "w1")
      ).resolves.toBeUndefined();
    });
  });
});
