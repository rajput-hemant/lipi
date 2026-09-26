import type Stripe from "stripe";

import {
  markStripeEventProcessed,
  upsertStripeCustomer,
  upsertSubscriptionRow,
} from "@/lib/db/queries/billing";
import { getStripe } from "@/lib/stripe/client";
import {
  resolveUserIdFromStripeSubscription,
  subscriptionRowFromStripe,
} from "@/lib/stripe/subscription-sync";

async function syncSubscription(
  subscription: Stripe.Subscription,
  userId: string
) {
  const row = subscriptionRowFromStripe(subscription, userId);
  await upsertSubscriptionRow(row);
}

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  const stripe = getStripe();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId =
        session.client_reference_id ?? session.metadata?.userId ?? null;

      if (!userId) {
        throw new Error("checkout.session.completed missing user id");
      }

      const stripeCustomerId =
        typeof session.customer === "string" ?
          session.customer
        : session.customer?.id;

      if (stripeCustomerId) {
        await upsertStripeCustomer(userId, stripeCustomerId);
      }

      const subscriptionId =
        typeof session.subscription === "string" ?
          session.subscription
        : session.subscription?.id;

      if (subscriptionId) {
        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);
        await syncSubscription(subscription, userId);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = resolveUserIdFromStripeSubscription(subscription);

      if (!userId) {
        throw new Error(`${event.type} missing user id metadata`);
      }

      await syncSubscription(subscription, userId);
      break;
    }
    default:
      break;
  }

  await markStripeEventProcessed(event.id, event.type);
}
