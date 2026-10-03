import { unstable_cache as cache } from "next/cache";
import { and, eq, notExists } from "drizzle-orm";

import { db } from "..";
import { collaborators, users, workspaces } from "../schema";
import { workspaceListTag } from "./workspace-list-tags";

// Not a "use server" module: these take a caller-supplied userId, so they must
// never be reachable as Server Action endpoints.

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

/**
 * @param userID User ID
 * @returns Private workspaces
 */
export async function getPrivateWorkspaces(userID: string) {
  return cache(
    async () => {
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
    ["get_private_workspaces", userID],
    { tags: [workspaceListTag("private", userID)] }
  )();
}

/**
 * @param userId User ID
 * @returns Collaborating workspaces
 */
export async function getCollaboratingWorkspaces(userId: string) {
  return cache(
    async () => {
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
    ["get_collaborating_workspaces", userId],
    { tags: [workspaceListTag("collaborating", userId)] }
  )();
}

/**
 * @param userId User ID
 * @returns Shared workspaces
 */
export async function getSharedWorkspaces(userId: string) {
  return cache(
    async () => {
      try {
        const data = await db
          .selectDistinct()
          .from(workspaces)
          .orderBy(workspaces.createdAt)
          .innerJoin(
            collaborators,
            eq(workspaces.id, collaborators.workspaceId)
          )
          .where(eq(workspaces.workspaceOwnerId, userId));

        return data.map(({ workspaces }) => workspaces);
      } catch (e) {
        console.error((e as Error).message);
        throw new Error("Failed to fetch shared workspaces!");
      }
    },
    ["get_shared_workspaces", userId],
    { tags: [workspaceListTag("shared", userId)] }
  )();
}
