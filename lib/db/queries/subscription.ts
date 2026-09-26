"use server";

import type { DBResponse } from ".";
import type { Subscription } from "@/types/db";

import { getCurrentBillingSubscription } from "@/lib/billing/subscription-access";

/**
 * Get user subscription
 * @param userId User ID
 * @returns Subscription
 */
export async function getUserSubscription(
  userId: string
): Promise<DBResponse<Subscription | null>> {
  try {
    const data = await getCurrentBillingSubscription(userId);

    return { data, error: null };
  } catch (error) {
    return { error: (error as Error).message, data: null };
  }
}
