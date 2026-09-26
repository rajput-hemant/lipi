"use server";

import { and, count, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { getUserSubscription } from "@/lib/db/queries";
import { collaborators, workspaces } from "@/lib/db/schema";
import { hasProEntitlement } from "./entitlement";
import { PlanQuotaError } from "./errors";
import { canAddCollaborator, canCreateWorkspace } from "./plan-quotas";

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

export async function assertUserCanCreateWorkspace(
  userId: string
): Promise<void> {
  const { data: subscription } = await getUserSubscription(userId);
  const isPro = hasProEntitlement(subscription);
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
  const { data: subscription } = await getUserSubscription(userId);
  const isPro = hasProEntitlement(subscription);
  const collaboratorCount = await countCollaboratorsForOwner(userId);

  if (!canAddCollaborator({ isPro, collaboratorCount })) {
    throw new PlanQuotaError(
      "collaborator",
      "Free plan allows two collaborators. Upgrade to Pro for unlimited collaborators."
    );
  }
}
