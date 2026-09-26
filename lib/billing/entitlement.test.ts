import { describe, expect, it } from "vitest";

import { hasConfiguredProEntitlement, hasProEntitlement } from "./entitlement";

const PRO_PRICE = "price_pro_monthly";

describe("hasProEntitlement", () => {
  it("requires the configured pro price", () => {
    expect(
      hasProEntitlement({ status: "active", priceId: "price_other" }, PRO_PRICE)
    ).toBe(false);
    expect(
      hasProEntitlement({ status: "active", priceId: PRO_PRICE }, PRO_PRICE)
    ).toBe(true);
  });

  it("treats billing as free when STRIPE_PRICE_ID_PRO is unset", () => {
    const previous = process.env.STRIPE_PRICE_ID_PRO;
    delete process.env.STRIPE_PRICE_ID_PRO;

    expect(
      hasConfiguredProEntitlement({
        status: "active",
        priceId: PRO_PRICE,
      })
    ).toBe(false);

    process.env.STRIPE_PRICE_ID_PRO = previous;
  });

  it("rejects canceled subscriptions even on the pro price", () => {
    expect(
      hasProEntitlement({ status: "canceled", priceId: PRO_PRICE }, PRO_PRICE)
    ).toBe(false);
  });
});
