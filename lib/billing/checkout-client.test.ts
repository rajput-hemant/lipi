import { afterEach, describe, expect, it, vi } from "vitest";

import {
  openStripeBillingPortal,
  startStripeCheckout,
} from "./checkout-client";

const assign = vi.fn();

function stubFetch(response: Response) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
  vi.stubGlobal("window", { location: { assign } });
}

afterEach(() => {
  vi.unstubAllGlobals();
  assign.mockReset();
});

describe("checkout client", () => {
  it("redirects to the returned url", async () => {
    stubFetch(Response.json({ url: "https://stripe.test/s" }));
    await startStripeCheckout();
    expect(assign).toHaveBeenCalledWith("https://stripe.test/s");
  });

  it("surfaces the API error message", async () => {
    stubFetch(Response.json({ error: "Not configured" }, { status: 503 }));
    await expect(startStripeCheckout()).rejects.toThrow("Not configured");
  });

  it("falls back to a friendly message for non-JSON failures", async () => {
    stubFetch(new Response("<html>Bad Gateway</html>", { status: 502 }));
    await expect(openStripeBillingPortal()).rejects.toThrow(
      "Billing portal failed"
    );
    expect(assign).not.toHaveBeenCalled();
  });
});
