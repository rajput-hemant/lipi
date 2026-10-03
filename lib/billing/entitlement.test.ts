import { afterEach, describe, expect, it, vi } from "vitest";

import { hasConfiguredProEntitlement, hasProEntitlement } from "./entitlement";

const PRO_PRICE = "price_pro_monthly";

describe("hasProEntitlement", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires the configured pro price", () => {
    expect(
      hasProEntitlement({ status: "active", priceId: "price_other" }, PRO_PRICE)
    ).toBe(false);
    expect(
      hasProEntitlement({ status: "active", priceId: PRO_PRICE }, PRO_PRICE)
    ).toBe(true);
  });

  it("treats billing as free when STRIPE_PRICE_ID_PRO is unset", () => {
    vi.stubEnv("STRIPE_PRICE_ID_PRO", undefined);

    expect(
      hasConfiguredProEntitlement({
        status: "active",
        priceId: PRO_PRICE,
      })
    ).toBe(false);
  });

  it("rejects canceled subscriptions even on the pro price", () => {
    expect(
      hasProEntitlement({ status: "canceled", priceId: PRO_PRICE }, PRO_PRICE)
    ).toBe(false);
  });
});
