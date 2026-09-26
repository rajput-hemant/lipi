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
  const where = vi.fn();
  const deleteFn = vi.fn(() => ({ where }));
  return { returning, insert, where, deleteFn };
});

vi.mock("@/lib/db", () => ({
  db: {
    insert: mocks.insert,
    delete: mocks.deleteFn,
  },
}));

describe("claimStripeWebhookEvent", () => {
  it("returns true only when the insert claims a new event id", async () => {
    mocks.returning.mockResolvedValueOnce([{ id: "evt_1" }]);
    await expect(
      claimStripeWebhookEvent("evt_1", "checkout.session.completed")
    ).resolves.toBe(true);

    mocks.returning.mockResolvedValueOnce([]);
    await expect(
      claimStripeWebhookEvent("evt_1", "checkout.session.completed")
    ).resolves.toBe(false);
  });
});

describe("releaseStripeWebhookEventClaim", () => {
  it("deletes the dedupe row so Stripe can retry", async () => {
    mocks.where.mockResolvedValueOnce(undefined);
    await releaseStripeWebhookEventClaim("evt_1");
    expect(mocks.deleteFn).toHaveBeenCalled();
    expect(mocks.where).toHaveBeenCalled();
  });
});
