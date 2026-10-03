import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { assertUserCanCreateBlock } from "./block-quota";
import { FREE_PLAN_MAX_BLOCKS } from "./plan-quotas";

const mocks = vi.hoisted(() => ({
  getCurrentBillingSubscription: vi.fn(),
}));

vi.mock("./subscription-access", () => ({
  getCurrentBillingSubscription: mocks.getCurrentBillingSubscription,
}));

describe("assertUserCanCreateBlock", () => {
  beforeEach(() => {
    vi.stubEnv("STRIPE_PRICE_ID_PRO", "price_pro");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows the last free block and rejects the next", async () => {
    mocks.getCurrentBillingSubscription.mockResolvedValue(null);

    await expect(
      assertUserCanCreateBlock("u1", FREE_PLAN_MAX_BLOCKS - 1)
    ).resolves.toBeUndefined();
    await expect(
      assertUserCanCreateBlock("u1", FREE_PLAN_MAX_BLOCKS)
    ).rejects.toMatchObject({ name: "PlanQuotaError", code: "block" });
  });

  it("is unlimited for pro subscribers", async () => {
    mocks.getCurrentBillingSubscription.mockResolvedValue({
      status: "trialing",
      priceId: "price_pro",
    });

    await expect(
      assertUserCanCreateBlock("u1", FREE_PLAN_MAX_BLOCKS * 10)
    ).resolves.toBeUndefined();
  });
});
