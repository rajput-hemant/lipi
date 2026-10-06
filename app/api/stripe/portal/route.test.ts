import { afterEach, describe, expect, it, vi } from "vitest";

import { BillingNotConfiguredError } from "@/lib/billing/errors";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  createSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@/lib/stripe/checkout", () => ({
  createBillingPortalSessionForUser: mocks.createSession,
}));

afterEach(() => vi.clearAllMocks());

describe("stripe portal route", () => {
  it("returns 401 without a signed-in user", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const response = await POST();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("returns the portal url", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1" });
    mocks.createSession.mockResolvedValue("https://stripe.test/p");

    const response = await POST();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ url: "https://stripe.test/p" });
    expect(mocks.createSession).toHaveBeenCalledWith("u1");
  });

  it("returns 503 when Stripe is not configured", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1" });
    mocks.createSession.mockRejectedValue(new BillingNotConfiguredError());

    const response = await POST();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Stripe billing is not configured",
    });
  });

  it("returns 400 when the user has no Stripe customer", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1" });
    mocks.createSession.mockRejectedValue(new Error("No Stripe customer yet"));

    const response = await POST();

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "No Stripe customer yet" });
  });

  it("returns a generic 500 for unexpected failures", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1" });
    mocks.createSession.mockRejectedValue(new Error("stripe down"));

    const response = await POST();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to create billing portal session",
    });
  });
});
