"use server";

import { hasConfiguredProEntitlement } from "./entitlement";
import { getCurrentBillingSubscription } from "./subscription-access";

export async function userHasProPlanEntitlement(
  userId: string
): Promise<boolean> {
  const subscription = await getCurrentBillingSubscription(userId);
  return hasConfiguredProEntitlement(subscription);
}
