"use server";

import { getUserSubscription } from "@/lib/db/queries";
import { hasProEntitlement } from "./entitlement";
import { PlanQuotaError } from "./errors";
import { canCreateBlock } from "./plan-quotas";

/**
 * Enforces the free-plan block limit. Wire this at editor block-create paths when
 * Phase 4 lands; callers pass the live block count for the workspace or document.
 */
export async function assertUserCanCreateBlock(
  userId: string,
  blockCount: number
): Promise<void> {
  const { data: subscription } = await getUserSubscription(userId);
  const isPro = hasProEntitlement(subscription);

  if (!canCreateBlock({ isPro, blockCount })) {
    throw new PlanQuotaError(
      "block",
      "Free plan allows up to 500 blocks. Upgrade to Pro for unlimited blocks."
    );
  }
}
