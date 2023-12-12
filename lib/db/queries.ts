"use server";

import type { Subscription } from "@/types/db";
import { db } from ".";

type Data<T> = { data: T; error: null } | { data: null; error: string };

/* -----------------------------------------------------------------------------------------------
 * Subscription
 * -----------------------------------------------------------------------------------------------*/

/**
 * Get user subscription status
 * @param userId User ID
 * @returns Subscription status
 */
export async function getUserSubscriptionStatus(
  userId: string
): Promise<Data<Subscription["status"]>> {
  try {
    const data = await db.query.subscriptions.findFirst({
      where: (s, { eq }) => eq(s.userId, userId),
    });

    return { data: data?.status ?? null, error: null };
  } catch (error) {
    return { error: (error as Error).message, data: null };
  }
}
