import { describe, expect, it, vi } from "vitest";

import {
  claimStripeWebhookEvent,
  releaseStripeWebhookEventClaim,
} from "./billing";

const mocks = vi.hoisted(() => {
  const returning = vi.fn();
  const onConflictDoNothing = vi.fn(() => ({ returning }));
  const values = vi.fn(() => ({ onConflictDoNothing }));
  const insert = vi.fn(() => ({ values }));
  const where = vi.fn(() => ({ returning }));
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));
  const deleteFn = vi.fn(() => ({ where }));
  const findFirst = vi.fn();
  return {
    returning,
    insert,
    where,
    deleteFn,
    update,
    set,
    findFirst,
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    insert: mocks.insert,
    delete: mocks.deleteFn,
    update: mocks.update,
    query: {
      stripeWebhookEvents: {
        findFirst: mocks.findFirst,
      },
    },
  },
}));

describe("claimStripeWebhookEvent", () => {
  it("returns claimed when the insert wins", async () => {
    mocks.returning.mockResolvedValueOnce([{ id: "evt_1" }]);
    await expect(
      claimStripeWebhookEvent("evt_1", "checkout.session.completed")
    ).resolves.toEqual({ status: "claimed" });
  });

  it("returns already_processed when processedAt is set", async () => {
    mocks.returning.mockResolvedValueOnce([]);
    mocks.findFirst.mockResolvedValueOnce({
      id: "evt_1",
      processedAt: "2026-01-01T00:00:00.000Z",
    });

    await expect(
      claimStripeWebhookEvent("evt_1", "checkout.session.completed")
    ).resolves.toEqual({ status: "already_processed" });
  });

  it("returns in_progress when another delivery holds the claim", async () => {
    mocks.returning.mockResolvedValueOnce([]);
    mocks.findFirst.mockResolvedValueOnce({
      id: "evt_1",
      processedAt: null,
    });
    mocks.returning.mockResolvedValueOnce([]);

    await expect(
      claimStripeWebhookEvent("evt_1", "checkout.session.completed")
    ).resolves.toEqual({ status: "in_progress" });
  });

  it("reclaims an expired in-progress claim", async () => {
    mocks.returning.mockResolvedValueOnce([]);
    mocks.findFirst.mockResolvedValueOnce({
      id: "evt_1",
      processedAt: null,
    });
    mocks.returning.mockResolvedValueOnce([{ id: "evt_1" }]);

    await expect(
      claimStripeWebhookEvent("evt_1", "checkout.session.completed")
    ).resolves.toEqual({ status: "claimed" });
    expect(mocks.update).toHaveBeenCalled();
  });
});

describe("releaseStripeWebhookEventClaim", () => {
  it("deletes the dedupe row so Stripe can retry", async () => {
    await releaseStripeWebhookEventClaim("evt_1");
    expect(mocks.deleteFn).toHaveBeenCalled();
    expect(mocks.where).toHaveBeenCalled();
  });
});
