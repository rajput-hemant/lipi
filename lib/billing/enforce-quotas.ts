import { and, count, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { collaborators, workspaces } from "@/lib/db/schema";
import { tryGetStripeProPriceId } from "@/lib/stripe/billing-env";
import { hasProEntitlement } from "./entitlement";
import { PlanQuotaError } from "./errors";
import { canAddCollaborator, canCreateWorkspace } from "./plan-quotas";
import { getCurrentBillingSubscription } from "./subscription-access";

export async function countOwnedWorkspaces(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(workspaces)
    .where(
      and(
        eq(workspaces.workspaceOwnerId, userId),
        eq(workspaces.inTrash, false)
      )
    );

  return Number(row?.value ?? 0);
}

export async function countCollaboratorsForOwner(
  userId: string
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(collaborators)
    .innerJoin(workspaces, eq(collaborators.workspaceId, workspaces.id))
    .where(eq(workspaces.workspaceOwnerId, userId));

  return Number(row?.value ?? 0);
}

function isProSubscriber(
  subscription: Awaited<ReturnType<typeof getCurrentBillingSubscription>>
): boolean {
  const proPriceId = tryGetStripeProPriceId();
  if (!proPriceId) return false;
  return hasProEntitlement(subscription, proPriceId);
}

export async function assertUserCanCreateWorkspace(
  userId: string
): Promise<void> {
  const subscription = await getCurrentBillingSubscription(userId);
  const isPro = isProSubscriber(subscription);
  const ownedWorkspaceCount = await countOwnedWorkspaces(userId);

  if (!canCreateWorkspace({ isPro, ownedWorkspaceCount })) {
    throw new PlanQuotaError(
      "workspace",
      "Free plan allows one workspace. Upgrade to Pro for unlimited workspaces."
    );
  }
}

export async function assertUserCanAddCollaborator(
  userId: string
): Promise<void> {
  const subscription = await getCurrentBillingSubscription(userId);
  const isPro = isProSubscriber(subscription);
  const collaboratorCount = await countCollaboratorsForOwner(userId);

  if (!canAddCollaborator({ isPro, collaboratorCount })) {
    throw new PlanQuotaError(
      "collaborator",
      "Free plan allows two collaborators. Upgrade to Pro for unlimited collaborators."
    );
  }
}
