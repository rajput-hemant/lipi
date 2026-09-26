import type { Subscription } from "@/types/db";

const PRO_STATUSES = new Set<Subscription["status"]>(["active", "trialing"]);

export function hasProEntitlement(
  subscription: Pick<Subscription, "status"> | null | undefined
): boolean {
  if (!subscription?.status) return false;
  return PRO_STATUSES.has(subscription.status);
}
