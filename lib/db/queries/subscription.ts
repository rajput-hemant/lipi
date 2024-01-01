"use server";

import type { Subscription } from "@/types/db";
import type { DBResponse } from ".";
import { db } from "..";

/**
 * Get user subscription
 * @param userId User ID
 * @returns Subscription
 */
export async function getUserSubscription(
  userId: string
): Promise<DBResponse<Subscription>> {
  try {
    const data = await db.query.subscriptions.findFirst({
      where: (s, { eq }) => eq(s.userId, userId),
    });

    if (!data) return { data: null, error: "Subscription not found" };

    return { data, error: null };
  } catch (error) {
    return { error: (error as Error).message, data: null };
  }
}
