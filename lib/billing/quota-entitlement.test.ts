import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentBillingSubscription: vi.fn(),
}));

vi.mock("./subscription-access", () => ({
  getCurrentBillingSubscription: mocks.getCurrentBillingSubscription,
}));

import { userHasProPlanEntitlement } from "./quota-entitlement";

describe("userHasProPlanEntitlement", () => {
  it("requires the configured pro price and trialing status", async () => {
    const previous = process.env.STRIPE_PRICE_ID_PRO;
    process.env.STRIPE_PRICE_ID_PRO = "price_pro";

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

    process.env.STRIPE_PRICE_ID_PRO = previous;
  });
});
