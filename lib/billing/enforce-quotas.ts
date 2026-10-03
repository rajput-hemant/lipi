import { and, count, eq, gt, ne, not } from "drizzle-orm";

import { db } from "@/lib/db";
import { collaborators, workspaceInvites, workspaces } from "@/lib/db/schema";
import { PlanQuotaError } from "./errors";
import {
  canAddCollaborator,
  canCreateWorkspace,
  canHoldCollaborators,
} from "./plan-quotas";
import { userHasProPlanEntitlement } from "./quota-entitlement";

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

export async function assertUserCanCreateWorkspace(
  userId: string
): Promise<void> {
  const isPro = await userHasProPlanEntitlement(userId);
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
  const isPro = await userHasProPlanEntitlement(userId);
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

/**
 * The new owner keeps the workspace's other collaborators and gains the old
 * owner as an editor, on top of collaborators in workspaces they already own.
 */
export async function assertUserCanReceiveWorkspaceTransfer(
  newOwnerId: string,
  workspaceId: string
): Promise<void> {
  if (await userHasProPlanEntitlement(newOwnerId)) return;

  const [row] = await db
    .select({ value: count() })
    .from(collaborators)
    .where(
      and(
        eq(collaborators.workspaceId, workspaceId),
        ne(collaborators.userId, newOwnerId)
      )
    );
  const collaboratorCount =
    (await countCollaboratorsForOwner(newOwnerId)) +
    Number(row?.value ?? 0) +
    1;

  if (!canHoldCollaborators({ isPro: false, collaboratorCount })) {
    throw new PlanQuotaError(
      "collaborator",
      "The new owner is on the Free plan, which allows two collaborators. Ask them to upgrade to Pro to receive this workspace."
    );
  }
}
