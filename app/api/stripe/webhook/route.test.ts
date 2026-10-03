import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  deliver: vi.fn(),
}));

vi.mock("@/lib/stripe/client", () => ({
  getStripe: () => ({ webhooks: { constructEvent: mocks.constructEvent } }),
}));
vi.mock("@/lib/stripe/billing-env", () => ({
  getStripeWebhookSecret: () => "whsec_test",
}));
vi.mock("@/lib/stripe/webhook-delivery", () => ({
  deliverStripeWebhookEvent: mocks.deliver,
}));

function request(signature?: string) {
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    body: "{}",
    headers: signature ? { "stripe-signature": signature } : {},
  });
}

describe("stripe webhook route", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mocks.constructEvent.mockReset();
    mocks.deliver.mockReset();
  });

  it("returns a generic 400 and logs the verification error server-side", async () => {
    const error = new Error("No signatures found matching the expected one");
    mocks.constructEvent.mockImplementation(() => {
      throw error;
    });
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const res = await POST(request("t=1,v1=bad"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid webhook signature" });
    expect(log).toHaveBeenCalledWith(
      "Stripe webhook verification failed:",
      error
    );
  });

  it("rejects requests without a signature header", async () => {
    const res = await POST(request());

    expect(res.status).toBe(400);
    expect(mocks.constructEvent).not.toHaveBeenCalled();
  });

  it("acknowledges verified events", async () => {
    mocks.constructEvent.mockReturnValue({ id: "evt_1" });
    mocks.deliver.mockResolvedValue({ kind: "processed" });

    const res = await POST(request("t=1,v1=ok"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
  });
});
