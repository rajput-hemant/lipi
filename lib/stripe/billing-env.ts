import { BillingNotConfiguredError } from "@/lib/billing/errors";

export function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new BillingNotConfiguredError();
  return key;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new BillingNotConfiguredError();
  return secret;
}

export function getStripeProPriceId(): string {
  const priceId = process.env.STRIPE_PRICE_ID_PRO;
  if (!priceId) throw new BillingNotConfiguredError();
  return priceId;
}
