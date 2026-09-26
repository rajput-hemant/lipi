import { beforeEach, describe, expect, it, vi } from "vitest";

import type Stripe from "stripe";

import { handleStripeWebhookEvent } from "./webhook-handlers";

const billingMocks = vi.hoisted(() => ({
  syncSubscriptionFromStripe: vi.fn(),
  upsertCatalogFromStripePrice: vi.fn(),
  upsertStripeCustomer: vi.fn(),
}));

const stripeMocks = vi.hoisted(() => ({
  retrieve: vi.fn(),
  pricesRetrieve: vi.fn(),
}));

vi.mock("@/lib/db/queries/billing", () => billingMocks);
vi.mock("@/lib/stripe/client", () => ({
  getStripe: () => ({
    subscriptions: { retrieve: stripeMocks.retrieve },
    prices: { retrieve: stripeMocks.pricesRetrieve },
  }),
}));

describe("handleStripeWebhookEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("syncs checkout.session.completed with expanded subscription retrieve", async () => {
    stripeMocks.retrieve.mockResolvedValue({
      id: "sub_1",
      status: "active",
      metadata: { userId: "user-1" },
      items: { data: [{ price: { id: "price_1" } }] },
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
    expect(stripeMocks.retrieve).toHaveBeenCalledWith("sub_1", {
      expand: ["items.data.price.product"],
    });
    expect(billingMocks.syncSubscriptionFromStripe).toHaveBeenCalled();
  });
});
