"use client";

export async function startStripeCheckout(): Promise<void> {
  const response = await fetch("/api/stripe/checkout", { method: "POST" });
  const payload = (await response.json()) as { url?: string; error?: string };

  if (!response.ok || !payload.url) {
    throw new Error(payload.error ?? "Checkout failed");
  }

  window.location.assign(payload.url);
}

export async function openStripeBillingPortal(): Promise<void> {
  const response = await fetch("/api/stripe/portal", { method: "POST" });
  const payload = (await response.json()) as { url?: string; error?: string };

  if (!response.ok || !payload.url) {
    throw new Error(payload.error ?? "Billing portal failed");
  }

  window.location.assign(payload.url);
}
