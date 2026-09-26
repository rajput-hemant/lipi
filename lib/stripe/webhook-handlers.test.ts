import { beforeEach, describe, expect, it, vi } from "vitest";

import type Stripe from "stripe";

import { handleStripeWebhookEvent } from "./webhook-handlers";

const billingMocks = vi.hoisted(() => ({
  markStripeEventProcessed: vi.fn(),
  upsertStripeCustomer: vi.fn(),
  upsertSubscriptionRow: vi.fn(),
}));

const stripeMocks = vi.hoisted(() => ({
  retrieve: vi.fn(),
}));

vi.mock("@/lib/db/queries/billing", () => billingMocks);
vi.mock("@/lib/stripe/client", () => ({
  getStripe: () => ({
    subscriptions: { retrieve: stripeMocks.retrieve },
  }),
}));

describe("handleStripeWebhookEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("syncs checkout.session.completed with subscription retrieve", async () => {
    stripeMocks.retrieve.mockResolvedValue({
      id: "sub_1",
      status: "active",
      metadata: { userId: "user-1" },
      cancel_at_period_end: false,
      created: 1,
      current_period_start: 1,
      current_period_end: 2,
      ended_at: null,
      cancel_at: null,
      canceled_at: null,
      trial_start: null,
      trial_end: null,
      items: {
        data: [
          {
            quantity: 1,
            price: { id: "price_1" },
            metadata: {},
            current_period_start: 1,
            current_period_end: 2,
          },
        ],
      },
    });

    await handleStripeWebhookEvent({
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: "user-1",
          customer: "cus_1",
          subscription: "sub_1",
        },
      },
    } as Stripe.Event);

    expect(billingMocks.upsertStripeCustomer).toHaveBeenCalledWith(
      "user-1",
      "cus_1"
    );
    expect(stripeMocks.retrieve).toHaveBeenCalledWith("sub_1");
    expect(billingMocks.upsertSubscriptionRow).toHaveBeenCalled();
    expect(billingMocks.markStripeEventProcessed).toHaveBeenCalledWith(
      "evt_1",
      "checkout.session.completed"
    );
  });
});
