import type Stripe from "stripe";

import {
  claimStripeWebhookEvent,
  markStripeWebhookEventProcessed,
  releaseStripeWebhookEventClaim,
} from "@/lib/db/queries/billing";
import { handleStripeWebhookEvent } from "./webhook-handlers";

export type StripeWebhookDeliveryResult =
  { kind: "duplicate" } | { kind: "in_progress" } | { kind: "processed" };

export async function deliverStripeWebhookEvent(
  event: Stripe.Event
): Promise<StripeWebhookDeliveryResult> {
  const claim = await claimStripeWebhookEvent(event.id, event.type);

  if (claim.status === "already_processed") {
    return { kind: "duplicate" };
  }

  if (claim.status === "in_progress") {
    return { kind: "in_progress" };
  }

  try {
    await handleStripeWebhookEvent(event);
    await markStripeWebhookEventProcessed(event.id);
    return { kind: "processed" };
  } catch (error) {
    await releaseStripeWebhookEventClaim(event.id);
    throw error;
  }
}
