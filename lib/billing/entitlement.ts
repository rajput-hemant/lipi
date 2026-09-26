import type { Subscription } from "@/types/db";

import { tryGetStripeProPriceId } from "@/lib/stripe/billing-env";

const PRO_STATUSES = new Set<Subscription["status"]>(["active", "trialing"]);

export function hasProEntitlement(
  subscription: Pick<Subscription, "status" | "priceId"> | null | undefined,
  proPriceId: string
): boolean {
  if (!subscription?.status || !subscription.priceId) return false;
  if (!PRO_STATUSES.has(subscription.status)) return false;
  return subscription.priceId === proPriceId;
}

export function hasConfiguredProEntitlement(
  subscription: Pick<Subscription, "status" | "priceId"> | null | undefined
): boolean {
  const proPriceId = tryGetStripeProPriceId();
  if (!proPriceId) return false;
  return hasProEntitlement(subscription, proPriceId);
}
