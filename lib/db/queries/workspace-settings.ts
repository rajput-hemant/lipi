"use server";

import { revalidateTag } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "..";
import { collaborators, workspaces } from "../schema";
import {
  authorizeWorkspaceDelete,
  authorizeWorkspaceOwnerAction,
  authorizeWorkspaceTransfer,
  MutationAuthError,
} from "./mutation-auth";

const updateWorkspaceSchema = z.object({
  workspaceId: z.uuid(),
  title: z.string().min(1).max(120).optional(),
  iconId: z.string().min(1).max(32).optional(),
  logo: z.union([z.url(), z.literal("")]).optional(),
});

const transferOwnershipSchema = z.object({
  workspaceId: z.uuid(),
  newOwnerUserId: z.uuid(),
});

const deleteWorkspaceSchema = z.object({
  workspaceId: z.uuid(),
});

function revalidateWorkspaceLists() {
  revalidateTag("get_private_workspaces", "max");
  revalidateTag("get_collaborating_workspaces", "max");
  revalidateTag("get_shared_workspaces", "max");
}

export async function updateWorkspaceSettings(input: unknown) {
  const parsed = updateWorkspaceSchema.parse(input);
  await authorizeWorkspaceOwnerAction(parsed.workspaceId);

  const patch: Partial<typeof workspaces.$inferInsert> = {};
  if (parsed.title !== undefined) patch.title = parsed.title;
  if (parsed.iconId !== undefined) patch.iconId = parsed.iconId;
  if (parsed.logo !== undefined) {
    patch.logo = parsed.logo === "" ? null : parsed.logo;
  }

  if (Object.keys(patch).length === 0) {
    throw new MutationAuthError("No changes provided");
  }

  const [updated] = await db
    .update(workspaces)
    .set(patch)
    .where(eq(workspaces.id, parsed.workspaceId))
    .returning();

  if (!updated) {
    throw new MutationAuthError("Workspace not found");
  }

  revalidateWorkspaceLists();
  return updated;
}

export async function transferWorkspaceOwnership(input: unknown) {
  const parsed = transferOwnershipSchema.parse(input);
  const user = await authorizeWorkspaceTransfer(parsed.workspaceId);

  if (parsed.newOwnerUserId === user.id) {
    throw new MutationAuthError("Choose a different member");
  }

  const [targetCollaborator] = await db
    .select()
    .from(collaborators)
    .where(
      and(
        eq(collaborators.userId, parsed.newOwnerUserId),
        eq(collaborators.workspaceId, parsed.workspaceId)
      )
    )
    .limit(1);

  if (!targetCollaborator) {
    throw new MutationAuthError("New owner must be an existing collaborator");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(workspaces)
      .set({ workspaceOwnerId: parsed.newOwnerUserId })
      .where(eq(workspaces.id, parsed.workspaceId));

    await tx
      .delete(collaborators)
      .where(eq(collaborators.id, targetCollaborator.id));

    const previousOwnerMembership = await tx.query.collaborators.findFirst({
      where: and(
        eq(collaborators.userId, user.id),
        eq(collaborators.workspaceId, parsed.workspaceId)
      ),
    });

    if (previousOwnerMembership) {
      await tx
        .update(collaborators)
        .set({ role: "editor" })
        .where(eq(collaborators.id, previousOwnerMembership.id));
    } else {
      await tx.insert(collaborators).values({
        workspaceId: parsed.workspaceId,
        userId: user.id,
        role: "editor",
      });
    }
  });

  revalidateWorkspaceLists();
}

export async function deleteWorkspace(input: unknown) {
  const parsed = deleteWorkspaceSchema.parse(input);
  await authorizeWorkspaceDelete(parsed.workspaceId);

  const [deleted] = await db
    .delete(workspaces)
    .where(eq(workspaces.id, parsed.workspaceId))
    .returning({ id: workspaces.id });

  if (!deleted) {
    throw new MutationAuthError("Workspace not found");
  }

  revalidateWorkspaceLists();
  return deleted;
}
