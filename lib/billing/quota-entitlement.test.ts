import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  userHasProPlanEntitlement,
  workspaceOwnerHasProPlanEntitlement,
} from "./quota-entitlement";

const mocks = vi.hoisted(() => ({
  env: {} as { STRIPE_PRICE_ID_PRO?: string },
  getCurrentBillingSubscription: vi.fn(),
  findWorkspace: vi.fn(),
}));

vi.mock("@/lib/env", () => ({ env: mocks.env }));

vi.mock("./subscription-access", () => ({
  getCurrentBillingSubscription: mocks.getCurrentBillingSubscription,
}));

vi.mock("@/lib/db", () => ({
  db: { query: { workspaces: { findFirst: mocks.findWorkspace } } },
}));

describe("userHasProPlanEntitlement", () => {
  afterEach(() => {
    mocks.env.STRIPE_PRICE_ID_PRO = undefined;
  });

  it("requires the configured pro price and trialing status", async () => {
    mocks.env.STRIPE_PRICE_ID_PRO = "price_pro";

    mocks.getCurrentBillingSubscription.mockResolvedValueOnce({
      status: "trialing",
      priceId: "price_pro",
    });
    await expect(userHasProPlanEntitlement("user-1")).resolves.toBe(true);

    mocks.getCurrentBillingSubscription.mockResolvedValueOnce({
      status: "active",
      priceId: "price_other",
    });
    await expect(userHasProPlanEntitlement("user-1")).resolves.toBe(false);
  });
});

describe("workspaceOwnerHasProPlanEntitlement", () => {
  const pro = { status: "active", priceId: "price_pro" };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.env.STRIPE_PRICE_ID_PRO = "price_pro";
    mocks.findWorkspace.mockResolvedValue({ workspaceOwnerId: "owner" });
  });

  afterEach(() => {
    mocks.env.STRIPE_PRICE_ID_PRO = undefined;
  });

  it("uses the owner's subscription, so a Free editor gets Pro limits", async () => {
    mocks.getCurrentBillingSubscription.mockImplementation(
      async (userId: string) => (userId === "owner" ? pro : null)
    );

    await expect(workspaceOwnerHasProPlanEntitlement("ws")).resolves.toBe(true);
    expect(mocks.getCurrentBillingSubscription).toHaveBeenCalledWith("owner");
  });

  it("is false for a Free owner even when the editor is Pro", async () => {
    mocks.getCurrentBillingSubscription.mockImplementation(
      async (userId: string) => (userId === "owner" ? null : pro)
    );

    await expect(workspaceOwnerHasProPlanEntitlement("ws")).resolves.toBe(
      false
    );
  });

  it("is false for an unknown workspace", async () => {
    mocks.findWorkspace.mockResolvedValue(undefined);

    await expect(workspaceOwnerHasProPlanEntitlement("ws")).resolves.toBe(
      false
    );
  });
});
