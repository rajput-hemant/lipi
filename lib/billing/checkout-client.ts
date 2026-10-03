"use client";

async function redirectToBillingUrl(endpoint: string, fallbackMessage: string) {
  const response = await fetch(endpoint, { method: "POST" });
  // Gateway or platform failures return non-JSON bodies; keep the message friendly.
  const payload = (await response.json().catch(() => ({}))) as {
    url?: string;
    error?: string;
  };

  if (!response.ok || !payload.url) {
    throw new Error(payload.error ?? fallbackMessage);
  }

  window.location.assign(payload.url);
}

export function startStripeCheckout(): Promise<void> {
  return redirectToBillingUrl("/api/stripe/checkout", "Checkout failed");
}

export function openStripeBillingPortal(): Promise<void> {
  return redirectToBillingUrl("/api/stripe/portal", "Billing portal failed");
}
