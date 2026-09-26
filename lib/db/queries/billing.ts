import { eq } from "drizzle-orm";

import type { Subscription } from "@/types/db";

import { db } from "..";
import { customers, stripeWebhookEvents, subscriptions } from "../schema";

export async function getCustomerByUserId(userId: string) {
  return db.query.customers.findFirst({
    where: eq(customers.id, userId),
  });
}

export async function upsertStripeCustomer(
  userId: string,
  stripeCustomerId: string
) {
  await db
    .insert(customers)
    .values({ id: userId, stripeCustomerId })
    .onConflictDoUpdate({
      target: customers.id,
      set: { stripeCustomerId },
    });
}

export async function upsertSubscriptionRow(row: Subscription) {
  await db
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

export async function hasProcessedStripeEvent(eventId: string) {
  const existing = await db.query.stripeWebhookEvents.findFirst({
    where: eq(stripeWebhookEvents.id, eventId),
  });
  return !!existing;
}

export async function markStripeEventProcessed(
  eventId: string,
  eventType: string
) {
  await db
    .insert(stripeWebhookEvents)
    .values({ id: eventId, type: eventType })
    .onConflictDoNothing();
}
