import { describe, expect, it } from "vitest";

import type Stripe from "stripe";

import { catalogRowsFromStripePrice } from "./catalog-sync";

describe("catalogRowsFromStripePrice", () => {
  it("maps expanded product and price for catalog upsert", () => {
    const { product, price } = catalogRowsFromStripePrice({
      id: "price_1",
      object: "price",
      active: true,
      currency: "inr",
      unit_amount: 49900,
      type: "recurring",
      nickname: "Pro monthly",
      metadata: {},
      recurring: {
        interval: "month",
        interval_count: 1,
        trial_period_days: null,
        usage_type: "licensed",
      },
      product: {
        id: "prod_1",
        object: "product",
        active: true,
        name: "Pro",
        description: "Pro plan",
        images: [],
        metadata: {},
      } as unknown as Stripe.Product,
    } as Stripe.Price);

    expect(product?.id).toBe("prod_1");
    expect(price?.id).toBe("price_1");
    expect(price?.productId).toBe("prod_1");
  });
});
