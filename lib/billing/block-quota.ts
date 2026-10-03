import { PlanQuotaError } from "./errors";
import { canCreateBlock } from "./plan-quotas";
import { workspaceOwnerHasProPlanEntitlement } from "./quota-entitlement";

/**
 * Enforces the free-plan block limit using the workspace owner's plan.
 * Callers pass the live block count for the document.
 */
export async function assertWorkspaceCanCreateBlock(
  workspaceId: string,
  blockCount: number
): Promise<void> {
  const isPro = await workspaceOwnerHasProPlanEntitlement(workspaceId);

  if (!canCreateBlock({ isPro, blockCount })) {
    throw new PlanQuotaError(
      "block",
      "Free plan allows up to 500 blocks. Upgrade to Pro for unlimited blocks."
    );
  }
}
