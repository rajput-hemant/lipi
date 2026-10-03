import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";
import { hasConfiguredProEntitlement } from "./entitlement";
import { getCurrentBillingSubscription } from "./subscription-access";

export async function userHasProPlanEntitlement(
  userId: string
): Promise<boolean> {
  const subscription = await getCurrentBillingSubscription(userId);
  return hasConfiguredProEntitlement(subscription);
}

/** Document and block quotas follow the workspace owner's plan, not the editor's. */
export async function workspaceOwnerHasProPlanEntitlement(
  workspaceId: string
): Promise<boolean> {
  const workspace = await db.query.workspaces.findFirst({
    columns: { workspaceOwnerId: true },
    where: eq(workspaces.id, workspaceId),
  });
  if (!workspace) return false;
  return userHasProPlanEntitlement(workspace.workspaceOwnerId);
}
