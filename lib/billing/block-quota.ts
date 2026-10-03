import { tryGetStripeProPriceId } from "@/lib/stripe/billing-env";
import { hasProEntitlement } from "./entitlement";
import { PlanQuotaError } from "./errors";
import { canCreateBlock } from "./plan-quotas";
import { getCurrentBillingSubscription } from "./subscription-access";

/**
 * Enforces the free-plan block limit. Wire this at editor block-create paths when
 * Phase 4 lands; callers pass the live block count for the workspace or document.
 */
export async function assertUserCanCreateBlock(
  userId: string,
  blockCount: number
): Promise<void> {
  const subscription = await getCurrentBillingSubscription(userId);
  const proPriceId = tryGetStripeProPriceId();
  const isPro =
    proPriceId ? hasProEntitlement(subscription, proPriceId) : false;

  if (!canCreateBlock({ isPro, blockCount })) {
    throw new PlanQuotaError(
      "block",
      "Free plan allows up to 500 blocks. Upgrade to Pro for unlimited blocks."
    );
  }
}
