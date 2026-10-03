"use server";

import { assertUserCanCreateWorkspace } from "@/lib/billing/enforce-quotas";
import { logger } from "@/lib/logger";
import { db } from "..";
import { requireAuthenticatedUser } from "../data/mutation-auth";
import { mutationFailure } from "../data/mutation-failure";
import { revalidateWorkspaceLists } from "../data/workspace-list-tags";
import { listWorkspacesForSwitcher } from "../data/workspace-lists";
import { workspaces } from "../schema";

export async function listWorkspacesForCurrentUser() {
  const user = await requireAuthenticatedUser();
  return listWorkspacesForSwitcher(user.id);
}

/**
 * Create workspace
 * @param workspace Title and icon; the owner is always the signed-in user
 * @returns Created workspace
 */
export async function createWorkspace(
  workspace: Pick<typeof workspaces.$inferInsert, "title" | "iconId">
) {
  try {
    const user = await requireAuthenticatedUser();

    await assertUserCanCreateWorkspace(user.id);

    const [data] = await db
      .insert(workspaces)
      .values({
        title: workspace.title,
        iconId: workspace.iconId,
        workspaceOwnerId: user.id,
      })
      .returning();

    revalidateWorkspaceLists([user.id]);
    return { ok: true, data } as const;
  } catch (e) {
    const failure = mutationFailure(e);
    if (failure) return failure;
    logger.error("Failed to create Workspace.", e);
    throw new Error("Failed to create Workspace.");
  }
}
