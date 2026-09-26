import type Stripe from "stripe";
import type { Subscription } from "@/types/db";

function unixToIso(unix: number | null | undefined): string | null {
  if (unix == null) return null;
  return new Date(unix * 1000).toISOString();
}

export function resolveUserIdFromStripeSubscription(
  subscription: Stripe.Subscription
): string | null {
  const fromMetadata = subscription.metadata?.userId;
  if (fromMetadata) return fromMetadata;

  const itemMetadata = subscription.items.data[0]?.metadata?.userId;
  return itemMetadata ?? null;
}

export function subscriptionRowFromStripe(
  subscription: Stripe.Subscription,
  userId: string
): Subscription {
  const primaryItem = subscription.items.data[0];
  const priceId = primaryItem?.price?.id ?? null;
  const status = subscription.status as Subscription["status"];

  return {
    id: subscription.id,
    userId,
    status,
    metadata: subscription.metadata ?? null,
    priceId,
    quantity: primaryItem?.quantity ?? 1,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    created: unixToIso(subscription.created) ?? new Date().toISOString(),
    currentPeriodStart:
      unixToIso(primaryItem?.current_period_start) ?? new Date().toISOString(),
    currentPeriodEnd:
      unixToIso(primaryItem?.current_period_end) ?? new Date().toISOString(),
    endedAt: unixToIso(subscription.ended_at),
    cancelAt: unixToIso(subscription.cancel_at),
    canceledAt: unixToIso(subscription.canceled_at),
    trialStart: unixToIso(subscription.trial_start),
    trialEnd: unixToIso(subscription.trial_end),
  };
}
