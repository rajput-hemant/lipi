import { BillingNotConfiguredError } from "@/lib/billing/errors";
import { env } from "@/lib/env";

export function getStripeSecretKey(): string {
  const key = env.STRIPE_SECRET_KEY;
  if (!key) throw new BillingNotConfiguredError();
  return key;
}

export function getStripeWebhookSecret(): string {
  const secret = env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new BillingNotConfiguredError();
  return secret;
}

export function tryGetStripeProPriceId(): string | undefined {
  return env.STRIPE_PRICE_ID_PRO;
}

export function getStripeProPriceId(): string {
  const priceId = tryGetStripeProPriceId();
  if (!priceId) throw new BillingNotConfiguredError();
  return priceId;
}
