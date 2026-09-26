import Stripe from "stripe";
import { describe, expect, it } from "vitest";

describe("stripe webhook signature verification", () => {
  it("accepts payloads signed with the webhook secret", () => {
    const secret = "whsec_test_secret";
    const stripe = new Stripe("sk_test_placeholder");
    const payload = JSON.stringify({
      id: "evt_test",
      object: "event",
      type: "customer.subscription.updated",
      data: { object: { id: "sub_test" } },
    });

    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
    });

    const event = stripe.webhooks.constructEvent(payload, header, secret);
    expect(event.id).toBe("evt_test");
  });
});
