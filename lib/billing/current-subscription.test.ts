import { describe, expect, it } from "vitest";

import type { Subscription } from "@/types/db";

import { pickCurrentSubscription } from "./current-subscription";

function sub(
  partial: Partial<Subscription> & Pick<Subscription, "id" | "status">
): Subscription {
  return {
    userId: "user-1",
    metadata: null,
    priceId: "price_pro",
    quantity: 1,
    cancelAtPeriodEnd: false,
    created: "2024-01-01T00:00:00.000Z",
    currentPeriodStart: "2024-01-01T00:00:00.000Z",
    currentPeriodEnd: "2024-02-01T00:00:00.000Z",
    endedAt: null,
    cancelAt: null,
    canceledAt: null,
    trialStart: null,
    trialEnd: null,
    ...partial,
  };
}

describe("pickCurrentSubscription", () => {
  it("prefers active over canceled with later period end", () => {
    const chosen = pickCurrentSubscription([
      sub({
        id: "sub_old_active",
        status: "active",
        currentPeriodEnd: "2024-03-01T00:00:00.000Z",
      }),
      sub({
        id: "sub_canceled",
        status: "canceled",
        currentPeriodEnd: "2025-01-01T00:00:00.000Z",
      }),
    ]);

    expect(chosen?.id).toBe("sub_old_active");
  });

  it("picks the latest period end among active rows", () => {
    const chosen = pickCurrentSubscription([
      sub({
        id: "sub_a",
        status: "active",
        currentPeriodEnd: "2024-02-01T00:00:00.000Z",
      }),
      sub({
        id: "sub_b",
        status: "trialing",
        currentPeriodEnd: "2024-06-01T00:00:00.000Z",
      }),
    ]);

    expect(chosen?.id).toBe("sub_b");
  });
});
