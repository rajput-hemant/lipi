import { beforeEach, describe, expect, it, vi } from "vitest";

import type Stripe from "stripe";

import { handleStripeWebhookEvent } from "./webhook-handlers";

const billingMocks = vi.hoisted(() => ({
  getCustomerByUserId: vi.fn(),
  syncSubscriptionFromStripe: vi.fn(),
  upsertCatalogFromStripePrice: vi.fn(),
}));

const stripeMocks = vi.hoisted(() => ({
  retrieve: vi.fn(),
  pricesRetrieve: vi.fn(),
}));

vi.mock("@/lib/db/data/billing", () => billingMocks);
vi.mock("@/lib/stripe/client", () => ({
  getStripe: () => ({
    subscriptions: { retrieve: stripeMocks.retrieve },
    prices: { retrieve: stripeMocks.pricesRetrieve },
  }),
}));

describe("handleStripeWebhookEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    billingMocks.getCustomerByUserId.mockResolvedValue({
      id: "user-1",
      stripeCustomerId: "cus_1",
    });
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

    expect(billingMocks.getCustomerByUserId).toHaveBeenCalledWith("user-1");
    expect(stripeMocks.retrieve).toHaveBeenCalledWith("sub_1", {
      expand: ["items.data.price.product"],
    });
    expect(billingMocks.syncSubscriptionFromStripe).toHaveBeenCalled();
  });

  it("rejects a completed checkout from a different Stripe customer", async () => {
    billingMocks.getCustomerByUserId.mockResolvedValueOnce({
      id: "user-1",
      stripeCustomerId: "cus_expected",
    });

    await expect(
      handleStripeWebhookEvent({
        id: "evt_2",
        type: "checkout.session.completed",
        data: {
          object: {
            client_reference_id: "user-1",
            customer: "cus_other",
            subscription: "sub_1",
          },
        },
      } as Stripe.Event)
    ).rejects.toThrow("customer mismatch");

    expect(stripeMocks.retrieve).not.toHaveBeenCalled();
    expect(billingMocks.syncSubscriptionFromStripe).not.toHaveBeenCalled();
  });

  it("rejects a completed checkout with no stored Stripe customer", async () => {
    billingMocks.getCustomerByUserId.mockResolvedValueOnce(null);

    await expect(
      handleStripeWebhookEvent({
        id: "evt_3",
        type: "checkout.session.completed",
        data: {
          object: {
            client_reference_id: "user-1",
            customer: "cus_1",
          },
        },
      } as Stripe.Event)
    ).rejects.toThrow("customer mismatch");
  });
});
