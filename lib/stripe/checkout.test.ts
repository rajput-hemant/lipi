import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCheckoutSessionForUser } from "./checkout";

const mocks = vi.hoisted(() => ({
  getCustomerByUserId: vi.fn(),
  upsertStripeCustomer: vi.fn(),
  customersCreate: vi.fn(),
  checkoutCreate: vi.fn(),
}));

vi.mock("@/lib/db/queries/billing", () => ({
  getCustomerByUserId: mocks.getCustomerByUserId,
  upsertStripeCustomer: mocks.upsertStripeCustomer,
}));
vi.mock("@/lib/auth/resolve-auth-base-url", () => ({
  resolveAuthBaseURL: () => "https://lipi.example",
}));
vi.mock("./billing-env", () => ({
  getStripeProPriceId: () => "price_pro",
}));
vi.mock("./client", () => ({
  getStripe: () => ({
    customers: { create: mocks.customersCreate },
    checkout: { sessions: { create: mocks.checkoutCreate } },
  }),
}));

describe("createCheckoutSessionForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCustomerByUserId.mockResolvedValue({
      id: "user-1",
      stripeCustomerId: "cus_1",
    });
    mocks.checkoutCreate.mockResolvedValue({ url: "https://checkout.example" });
  });

  it("binds checkout to the user's existing Stripe customer and reference", async () => {
    await expect(
      createCheckoutSessionForUser({
        userId: "user-1",
        email: "user@example.com",
      })
    ).resolves.toBe("https://checkout.example");

    expect(mocks.checkoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_1",
        client_reference_id: "user-1",
      })
    );
    expect(mocks.customersCreate).not.toHaveBeenCalled();
  });
});
