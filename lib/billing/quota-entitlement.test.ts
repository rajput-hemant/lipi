import { afterEach, describe, expect, it, vi } from "vitest";

import { userHasProPlanEntitlement } from "./quota-entitlement";

const mocks = vi.hoisted(() => ({
  getCurrentBillingSubscription: vi.fn(),
}));

vi.mock("./subscription-access", () => ({
  getCurrentBillingSubscription: mocks.getCurrentBillingSubscription,
}));

describe("userHasProPlanEntitlement", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires the configured pro price and trialing status", async () => {
    vi.stubEnv("STRIPE_PRICE_ID_PRO", "price_pro");

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
