import type Stripe from "stripe";

import {
  claimStripeWebhookEvent,
  releaseStripeWebhookEventClaim,
} from "@/lib/db/queries/billing";
import { handleStripeWebhookEvent } from "./webhook-handlers";

export type StripeWebhookDeliveryResult =
  { kind: "duplicate" } | { kind: "processed" };

export async function deliverStripeWebhookEvent(
  event: Stripe.Event
): Promise<StripeWebhookDeliveryResult> {
  const claimed = await claimStripeWebhookEvent(event.id, event.type);
  if (!claimed) {
    return { kind: "duplicate" };
  }

  try {
    await handleStripeWebhookEvent(event);
    return { kind: "processed" };
  } catch (error) {
    await releaseStripeWebhookEventClaim(event.id);
    throw error;
  }
}
