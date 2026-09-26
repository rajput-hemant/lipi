import type Stripe from "stripe";

import {
  syncSubscriptionFromStripe,
  upsertCatalogFromStripePrice,
  upsertStripeCustomer,
} from "@/lib/db/queries/billing";
import { getStripe } from "@/lib/stripe/client";
import { resolveUserIdFromStripeSubscription } from "@/lib/stripe/subscription-sync";

const SUBSCRIPTION_EXPAND = ["items.data.price.product"] as const;

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
        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId,
          { expand: [...SUBSCRIPTION_EXPAND] }
        );
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

      const expanded = await stripe.subscriptions.retrieve(subscription.id, {
        expand: [...SUBSCRIPTION_EXPAND],
      });
      await syncSubscriptionFromStripe(expanded, userId);
      break;
    }
    case "price.created":
    case "price.updated": {
      const price = event.data.object as Stripe.Price;
      const expanded =
        typeof price.product === "string" ?
          await stripe.prices.retrieve(price.id, {
            expand: ["product"],
          })
        : price;
      await upsertCatalogFromStripePrice(expanded);
      break;
    }
    case "product.created":
    case "product.updated": {
      const product = event.data.object as Stripe.Product;
      const defaultPriceId =
        typeof product.default_price === "string" ?
          product.default_price
        : product.default_price?.id;

      if (defaultPriceId) {
        const price = await stripe.prices.retrieve(defaultPriceId, {
          expand: ["product"],
        });
        await upsertCatalogFromStripePrice(price);
      }
      break;
    }
    default:
      break;
  }
}
