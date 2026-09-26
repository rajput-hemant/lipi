import { describe, expect, it } from "vitest";

import type Stripe from "stripe";

import {
  resolveUserIdFromStripeSubscription,
  subscriptionRowFromStripe,
} from "./subscription-sync";

describe("subscriptionRowFromStripe", () => {
  it("maps stripe subscription fields onto the lipi row shape", () => {
    const row = subscriptionRowFromStripe(
      {
        id: "sub_123",
        object: "subscription",
        status: "active",
        metadata: { userId: "user-1" },
        cancel_at_period_end: false,
        created: 1_700_000_000,
        ended_at: null,
        cancel_at: null,
        canceled_at: null,
        trial_start: null,
        trial_end: null,
        items: {
          object: "list",
          data: [
            {
              id: "si_1",
              object: "subscription_item",
              metadata: {},
              quantity: 1,
              current_period_start: 1_700_000_000,
              current_period_end: 1_700_259_200,
              price: {
                id: "price_pro",
                object: "price",
              } as Stripe.Price,
            } as Stripe.SubscriptionItem,
          ],
          has_more: false,
          url: "/v1/subscription_items",
        },
      } as unknown as Stripe.Subscription,
      "user-1"
    );

    expect(row.id).toBe("sub_123");
    expect(row.userId).toBe("user-1");
    expect(row.status).toBe("active");
    expect(row.priceId).toBe("price_pro");
    expect(row.currentPeriodEnd).toBe(
      new Date(1_700_259_200 * 1000).toISOString()
    );
  });
});

describe("resolveUserIdFromStripeSubscription", () => {
  it("reads userId from subscription metadata", () => {
    expect(
      resolveUserIdFromStripeSubscription({
        metadata: { userId: "abc" },
        items: { data: [] },
      } as unknown as Stripe.Subscription)
    ).toBe("abc");
  });
});
