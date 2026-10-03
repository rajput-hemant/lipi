import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  assertUserCanAddCollaborator,
  assertUserCanCreateWorkspace,
} from "./enforce-quotas";
import { PlanQuotaError } from "./errors";

const mocks = vi.hoisted(() => ({
  getCurrentBillingSubscription: vi.fn(),
  rows: [] as { value: number }[][],
}));

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

vi.mock("@/lib/db/schema", () => ({ collaborators: {}, workspaces: {} }));

const proSubscription = { status: "active", priceId: "price_pro" };

describe("plan quota enforcement", () => {
  beforeEach(() => {
    mocks.rows = [];
    mocks.getCurrentBillingSubscription.mockReset();
    vi.stubEnv("STRIPE_PRICE_ID_PRO", "price_pro");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
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

  it("treats a pro subscription as free when the pro price is unconfigured", async () => {
    vi.stubEnv("STRIPE_PRICE_ID_PRO", undefined);
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
});
