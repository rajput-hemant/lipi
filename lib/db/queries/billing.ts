import { and, eq, isNull, lt, sql } from "drizzle-orm";

import type Stripe from "stripe";
import type { Subscription } from "@/types/db";

import { catalogRowsFromStripePrice } from "@/lib/stripe/catalog-sync";
import { subscriptionRowFromStripe } from "@/lib/stripe/subscription-sync";
import { db } from "..";
import {
  customers,
  prices,
  products,
  stripeWebhookEvents,
  subscriptions,
} from "../schema";

type BillingTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbClient = typeof db | BillingTx;

export async function getCustomerByUserId(userId: string) {
  return db.query.customers.findFirst({
    where: eq(customers.id, userId),
  });
}

export async function upsertStripeCustomer(
  userId: string,
  stripeCustomerId: string,
  client: DbClient = db
) {
  await client
    .insert(customers)
    .values({ id: userId, stripeCustomerId })
    .onConflictDoUpdate({
      target: customers.id,
      set: { stripeCustomerId },
    });
}

export async function upsertProductRow(
  row: typeof products.$inferInsert,
  client: DbClient = db
) {
  await client
    .insert(products)
    .values(row)
    .onConflictDoUpdate({
      target: products.id,
      set: {
        active: row.active,
        name: row.name,
        description: row.description,
        image: row.image,
        metadata: row.metadata,
      },
    });
}

export async function upsertPriceRow(
  row: typeof prices.$inferInsert,
  client: DbClient = db
) {
  await client
    .insert(prices)
    .values(row)
    .onConflictDoUpdate({
      target: prices.id,
      set: {
        productId: row.productId,
        active: row.active,
        description: row.description,
        unitAmount: row.unitAmount,
        currency: row.currency,
        type: row.type,
        interval: row.interval,
        intervalCount: row.intervalCount,
        trialPeriodDays: row.trialPeriodDays,
        metadata: row.metadata,
      },
    });
}

export async function upsertCatalogFromStripePrice(
  stripePrice: Stripe.Price,
  client: DbClient = db
) {
  const { product, price } = catalogRowsFromStripePrice(stripePrice);
  if (product) {
    await upsertProductRow(product, client);
  }
  if (price) {
    await upsertPriceRow(price, client);
  }
}

export async function upsertSubscriptionRow(
  row: Subscription,
  client: DbClient = db
) {
  await client
    .insert(subscriptions)
    .values(row)
    .onConflictDoUpdate({
      target: subscriptions.id,
      set: {
        userId: row.userId,
        status: row.status,
        metadata: row.metadata,
        priceId: row.priceId,
        quantity: row.quantity,
        cancelAtPeriodEnd: row.cancelAtPeriodEnd,
        created: row.created,
        currentPeriodStart: row.currentPeriodStart,
        currentPeriodEnd: row.currentPeriodEnd,
        endedAt: row.endedAt,
        cancelAt: row.cancelAt,
        canceledAt: row.canceledAt,
        trialStart: row.trialStart,
        trialEnd: row.trialEnd,
      },
    });
}

export async function syncSubscriptionFromStripe(
  stripeSubscription: Stripe.Subscription,
  userId: string
) {
  await db.transaction(async (tx) => {
    for (const item of stripeSubscription.items.data) {
      const stripePrice = item.price;
      if (stripePrice && typeof stripePrice !== "string") {
        await upsertCatalogFromStripePrice(stripePrice, tx);
      }
    }

    const row = subscriptionRowFromStripe(stripeSubscription, userId);
    await upsertSubscriptionRow(row, tx);
  });
}

export type StripeWebhookClaimResult =
  | { status: "claimed" }
  | { status: "already_processed" }
  | { status: "in_progress" };

export async function claimStripeWebhookEvent(
  eventId: string,
  eventType: string
): Promise<StripeWebhookClaimResult> {
  const [claimed] = await db
    .insert(stripeWebhookEvents)
    .values({ id: eventId, type: eventType, processedAt: null })
    .onConflictDoNothing()
    .returning({ id: stripeWebhookEvents.id });

  if (claimed) {
    return { status: "claimed" };
  }

  const existing = await db.query.stripeWebhookEvents.findFirst({
    where: eq(stripeWebhookEvents.id, eventId),
  });

  if (!existing) {
    return claimStripeWebhookEvent(eventId, eventType);
  }

  if (existing.processedAt) {
    return { status: "already_processed" };
  }

  const [reclaimed] = await db
    .update(stripeWebhookEvents)
    .set({ claimExpiresAt: sql`now() + interval '5 minutes'` })
    .where(
      and(
        eq(stripeWebhookEvents.id, eventId),
        isNull(stripeWebhookEvents.processedAt),
        lt(stripeWebhookEvents.claimExpiresAt, sql`now()`)
      )
    )
    .returning({ id: stripeWebhookEvents.id });

  if (reclaimed) {
    return { status: "claimed" };
  }

  return { status: "in_progress" };
}

export async function markStripeWebhookEventProcessed(eventId: string) {
  await db
    .update(stripeWebhookEvents)
    .set({ processedAt: new Date().toISOString() })
    .where(eq(stripeWebhookEvents.id, eventId));
}

export async function releaseStripeWebhookEventClaim(eventId: string) {
  await db
    .delete(stripeWebhookEvents)
    .where(eq(stripeWebhookEvents.id, eventId));
}
