import { describe, expect, it, vi } from "vitest";

import type Stripe from "stripe";

import { deliverStripeWebhookEvent } from "./webhook-delivery";

const mocks = vi.hoisted(() => ({
  claimStripeWebhookEvent: vi.fn(),
  markStripeWebhookEventProcessed: vi.fn(),
  releaseStripeWebhookEventClaim: vi.fn(),
  handleStripeWebhookEvent: vi.fn(),
}));

vi.mock("@/lib/db/queries/billing", () => ({
  claimStripeWebhookEvent: mocks.claimStripeWebhookEvent,
  markStripeWebhookEventProcessed: mocks.markStripeWebhookEventProcessed,
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
  it("returns duplicate only when the event is already processed", async () => {
    mocks.claimStripeWebhookEvent.mockResolvedValueOnce({
      status: "already_processed",
    });

    await expect(deliverStripeWebhookEvent(event)).resolves.toEqual({
      kind: "duplicate",
    });
    expect(mocks.handleStripeWebhookEvent).not.toHaveBeenCalled();
  });

  it("returns in_progress when another worker holds an unprocessed claim", async () => {
    mocks.claimStripeWebhookEvent.mockResolvedValueOnce({
      status: "in_progress",
    });

    await expect(deliverStripeWebhookEvent(event)).resolves.toEqual({
      kind: "in_progress",
    });
    expect(mocks.handleStripeWebhookEvent).not.toHaveBeenCalled();
  });

  it("releases the claim and rethrows when handling fails", async () => {
    mocks.claimStripeWebhookEvent.mockResolvedValueOnce({ status: "claimed" });
    mocks.handleStripeWebhookEvent.mockRejectedValueOnce(new Error("db down"));
    mocks.releaseStripeWebhookEventClaim.mockResolvedValueOnce(undefined);

    await expect(deliverStripeWebhookEvent(event)).rejects.toThrow("db down");
    expect(mocks.releaseStripeWebhookEventClaim).toHaveBeenCalledWith("evt_1");
    expect(mocks.markStripeWebhookEventProcessed).not.toHaveBeenCalled();
  });

  it("marks the event processed when handling succeeds", async () => {
    mocks.claimStripeWebhookEvent.mockResolvedValueOnce({ status: "claimed" });
    mocks.handleStripeWebhookEvent.mockResolvedValueOnce(undefined);
    mocks.markStripeWebhookEventProcessed.mockResolvedValueOnce(undefined);

    await expect(deliverStripeWebhookEvent(event)).resolves.toEqual({
      kind: "processed",
    });
    expect(mocks.markStripeWebhookEventProcessed).toHaveBeenCalledWith("evt_1");
    expect(mocks.releaseStripeWebhookEventClaim).not.toHaveBeenCalled();
  });
});
