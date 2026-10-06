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
  createCheckoutSessionForUser: mocks.createSession,
}));

afterEach(() => vi.clearAllMocks());

describe("stripe checkout route", () => {
  it("returns 401 without a signed-in user with an email", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1" });

    const response = await POST();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("returns the checkout url", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: "a@b.co" });
    mocks.createSession.mockResolvedValue("https://stripe.test/c");

    const response = await POST();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ url: "https://stripe.test/c" });
    expect(mocks.createSession).toHaveBeenCalledWith({
      userId: "u1",
      email: "a@b.co",
    });
  });

  it("returns 503 when Stripe is not configured", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: "a@b.co" });
    mocks.createSession.mockRejectedValue(new BillingNotConfiguredError());

    const response = await POST();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Stripe billing is not configured",
    });
  });

  it("returns a generic 500 for unexpected failures", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1", email: "a@b.co" });
    mocks.createSession.mockRejectedValue(new Error("stripe down"));

    const response = await POST();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to create checkout session",
    });
  });
});
