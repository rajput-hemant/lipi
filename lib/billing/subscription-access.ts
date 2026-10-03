import { eq } from "drizzle-orm";

import type { Subscription } from "@/types/db";

import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { pickCurrentSubscription } from "./current-subscription";

export async function getCurrentBillingSubscription(
  userId: string
): Promise<Subscription | null> {
  const rows = await db.query.subscriptions.findMany({
    where: eq(subscriptions.userId, userId),
  });

  return pickCurrentSubscription(rows);
}
