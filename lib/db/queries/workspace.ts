"use server";

import { unstable_cache as cache, revalidateTag } from "next/cache";
import { and, eq, notExists } from "drizzle-orm";

import type { Workspace } from "@/types/db";

import { assertUserCanCreateWorkspace } from "@/lib/billing/enforce-quotas";
import { PlanQuotaError } from "@/lib/billing/errors";
import { db } from "..";
import { collaborators, users, workspaces } from "../schema";
import { MutationAuthError, requireAuthenticatedUser } from "./mutation-auth";

export async function getDefaultWorkspaceId(userId: string) {
  const owned = await db.query.workspaces.findFirst({
    where: eq(workspaces.workspaceOwnerId, userId),
    orderBy: (workspace, { asc }) => [asc(workspace.createdAt)],
  });

  if (owned) {
    return owned.id;
  }

  const membership = await db.query.collaborators.findFirst({
    where: eq(collaborators.userId, userId),
    orderBy: (row, { asc }) => [asc(row.createdAt)],
  });

  return membership?.workspaceId ?? null;
}

export async function listWorkspacesForSwitcher(userId: string) {
  const [privateWorkspaces, collaborating, shared] = await Promise.all([
    getPrivateWorkspaces(userId),
    getCollaboratingWorkspaces(userId),
    getSharedWorkspaces(userId),
  ]);

  return {
    privateWorkspaces,
    collaborating,
    shared,
  };
}

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

    return data;
  } catch (e) {
    if (e instanceof PlanQuotaError) {
      throw e;
    }
    console.error((e as Error).message);
    throw new Error("Failed to create Workspace.");
  } finally {
    revalidateTag("get_private_workspaces", "max");
    revalidateTag("get_collaborating_workspaces", "max");
    revalidateTag("get_shared_workspaces", "max");
  }
}

/**
 * @param userID User ID
 * @returns Private workspaces
 */
export const getPrivateWorkspaces = cache(
  async (userID: string) => {
    try {
      const data = await db
        .select()
        .from(workspaces)
        .where(
          and(
            eq(workspaces.workspaceOwnerId, userID),
            notExists(
              db
                .select()
                .from(collaborators)
                .where(eq(collaborators.workspaceId, workspaces.id))
            )
          )
        );

      return data;
    } catch (e) {
      console.error((e as Error).message);
      throw new Error("Failed to fetch private workspaces!");
    }
  },
  ["get_private_workspaces"],
  { tags: ["get_private_workspaces"] }
);

/**
 * @param userId User ID
 * @returns Collaborating workspaces
 */
export const getCollaboratingWorkspaces = cache(
  async (userId: string) => {
    try {
      const data = await db
        .select()
        .from(users)
        .innerJoin(collaborators, eq(users.id, collaborators.userId))
        .innerJoin(workspaces, eq(collaborators.workspaceId, workspaces.id))
        .where(eq(users.id, userId));

      return data.map(({ workspaces }) => workspaces);
    } catch (e) {
      console.error((e as Error).message);
      throw new Error("Failed to fetch collaborating workspaces!");
    }
  },
  ["get_collaborating_workspaces"],
  { tags: ["get_collaborating_workspaces"] }
);

/**
 * @param userId User ID
 * @returns Shared workspaces
 */
export const getSharedWorkspaces = cache(
  async (userId: string) => {
    try {
      const data = await db
        .selectDistinct()
        .from(workspaces)
        .orderBy(workspaces.createdAt)
        .innerJoin(collaborators, eq(workspaces.id, collaborators.workspaceId))
        .where(eq(workspaces.workspaceOwnerId, userId));

      return data.map(({ workspaces }) => workspaces);
    } catch (e) {
      console.error((e as Error).message);
      throw new Error("Failed to fetch shared workspaces!");
    }
  },
  ["get_shared_workspaces"],
  { tags: ["get_shared_workspaces"] }
);
