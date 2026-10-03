"use server";

import { revalidateTag } from "next/cache";

import type { Workspace } from "@/types/db";

import { assertUserCanCreateWorkspace } from "@/lib/billing/enforce-quotas";
import { db } from "..";
import { workspaces } from "../schema";
import { MutationAuthError, requireAuthenticatedUser } from "./mutation-auth";
import { mutationFailure } from "./mutation-failure";
import { listWorkspacesForSwitcher } from "./workspace-lists";

export async function listWorkspacesForCurrentUser() {
  const user = await requireAuthenticatedUser();
  return listWorkspacesForSwitcher(user.id);
}

/**
 * Create workspace
 * @param workspace Workspace
 * @returns Created workspace
 */
export async function createWorkspace(workspace: Workspace) {
  try {
    const user = await requireAuthenticatedUser();

    if (workspace.workspaceOwnerId !== user.id) {
      throw new MutationAuthError("Forbidden", "FORBIDDEN");
    }

    await assertUserCanCreateWorkspace(user.id);

    const [data] = await db.insert(workspaces).values(workspace).returning();

    return { ok: true, data } as const;
  } catch (e) {
    const failure = mutationFailure(e);
    if (failure) return failure;
    console.error((e as Error).message);
    throw new Error("Failed to create Workspace.");
  } finally {
    revalidateTag("get_private_workspaces", "max");
    revalidateTag("get_collaborating_workspaces", "max");
    revalidateTag("get_shared_workspaces", "max");
  }
}
