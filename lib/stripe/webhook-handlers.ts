import type Stripe from "stripe";

import {
  getCustomerByUserId,
  syncSubscriptionFromStripe,
} from "@/lib/db/data/billing";
import { getStripe } from "@/lib/stripe/client";
import { resolveUserIdFromStripeSubscription } from "@/lib/stripe/subscription-sync";

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  const stripe = getStripe();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;

      if (!userId) {
        throw new Error("checkout.session.completed missing user id");
      }

      const stripeCustomerId =
        typeof session.customer === "string" ?
          session.customer
        : session.customer?.id;

      const customer = await getCustomerByUserId(userId);
      if (
        !customer?.stripeCustomerId ||
        customer.stripeCustomerId !== stripeCustomerId
      ) {
        throw new Error("checkout.session.completed customer mismatch");
      }

      const subscriptionId =
        typeof session.subscription === "string" ?
          session.subscription
        : session.subscription?.id;

      if (subscriptionId) {
        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);
        await syncSubscriptionFromStripe(subscription, userId);
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

      const current = await stripe.subscriptions.retrieve(subscription.id);
      await syncSubscriptionFromStripe(current, userId);
      break;
    }
    default:
      break;
  }
}
