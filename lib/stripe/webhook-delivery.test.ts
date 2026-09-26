import { describe, expect, it, vi } from "vitest";

import type Stripe from "stripe";

import { deliverStripeWebhookEvent } from "./webhook-delivery";

const mocks = vi.hoisted(() => ({
  claimStripeWebhookEvent: vi.fn(),
  releaseStripeWebhookEventClaim: vi.fn(),
  handleStripeWebhookEvent: vi.fn(),
}));

vi.mock("@/lib/db/queries/billing", () => ({
  claimStripeWebhookEvent: mocks.claimStripeWebhookEvent,
  releaseStripeWebhookEventClaim: mocks.releaseStripeWebhookEventClaim,
}));

vi.mock("./webhook-handlers", () => ({
  handleStripeWebhookEvent: mocks.handleStripeWebhookEvent,
}));

const event = {
  id: "evt_1",
  type: "checkout.session.completed",
} as Stripe.Event;

describe("deliverStripeWebhookEvent", () => {
  it("skips processing when the event was already claimed", async () => {
    mocks.claimStripeWebhookEvent.mockResolvedValueOnce(false);

    await expect(deliverStripeWebhookEvent(event)).resolves.toEqual({
      kind: "duplicate",
    });
    expect(mocks.handleStripeWebhookEvent).not.toHaveBeenCalled();
  });

  it("releases the claim and rethrows when handling fails", async () => {
    mocks.claimStripeWebhookEvent.mockResolvedValueOnce(true);
    mocks.handleStripeWebhookEvent.mockRejectedValueOnce(new Error("db down"));
    mocks.releaseStripeWebhookEventClaim.mockResolvedValueOnce(undefined);

    await expect(deliverStripeWebhookEvent(event)).rejects.toThrow("db down");
    expect(mocks.releaseStripeWebhookEventClaim).toHaveBeenCalledWith("evt_1");
  });

  it("keeps the claim when handling succeeds", async () => {
    mocks.claimStripeWebhookEvent.mockResolvedValueOnce(true);
    mocks.handleStripeWebhookEvent.mockResolvedValueOnce(undefined);

    await expect(deliverStripeWebhookEvent(event)).resolves.toEqual({
      kind: "processed",
    });
    expect(mocks.releaseStripeWebhookEventClaim).not.toHaveBeenCalled();
  });
});
