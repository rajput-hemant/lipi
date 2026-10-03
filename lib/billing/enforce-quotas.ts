import { and, count, eq, gt, not } from "drizzle-orm";

import { db } from "@/lib/db";
import { collaborators, workspaceInvites, workspaces } from "@/lib/db/schema";
import { tryGetStripeProPriceId } from "@/lib/stripe/billing-env";
import { hasProEntitlement } from "./entitlement";
import { PlanQuotaError } from "./errors";
import { canAddCollaborator, canCreateWorkspace } from "./plan-quotas";
import { getCurrentBillingSubscription } from "./subscription-access";

export type PendingInviteRef = { workspaceId: string; email: string };

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

async function countPendingInvitesForOwner(
  userId: string,
  excluding: PendingInviteRef
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(workspaceInvites)
    .innerJoin(workspaces, eq(workspaceInvites.workspaceId, workspaces.id))
    .where(
      and(
        eq(workspaces.workspaceOwnerId, userId),
        gt(workspaceInvites.expiresAt, new Date().toISOString()),
        not(
          and(
            eq(workspaceInvites.workspaceId, excluding.workspaceId),
            eq(workspaceInvites.email, excluding.email)
          )!
        )
      )
    );

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

/**
 * Pass `invite` when inviting: other unexpired pending invites then count
 * toward the limit, except the one being (re)issued for the same email.
 */
export async function assertUserCanAddCollaborator(
  userId: string,
  invite?: PendingInviteRef
): Promise<void> {
  const subscription = await getCurrentBillingSubscription(userId);
  const isPro = isProSubscriber(subscription);
  const collaboratorCount =
    (await countCollaboratorsForOwner(userId)) +
    (invite ? await countPendingInvitesForOwner(userId, invite) : 0);

  if (!canAddCollaborator({ isPro, collaboratorCount })) {
    throw new PlanQuotaError(
      "collaborator",
      "Free plan allows two collaborators. Upgrade to Pro for unlimited collaborators."
    );
  }
}
