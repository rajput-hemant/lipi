import { unstable_cache as cache } from "next/cache";
import { and, eq, notExists } from "drizzle-orm";

import type { WorkspaceListKind } from "./workspace-list-tags";

import { logger } from "@/lib/logger";
import { db } from "..";
import { collaborators, workspaces } from "../schema";
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

/** Caches one user's list under its tag; failures are logged and surfaced generically. */
function cachedWorkspaceList<T>(
  kind: WorkspaceListKind,
  userId: string,
  load: () => Promise<T>
) {
  return cache(
    async () => {
      try {
        return await load();
      } catch (e) {
        logger.error(`Failed to fetch ${kind} workspaces!`, e);
        throw new Error(`Failed to fetch ${kind} workspaces!`);
      }
    },
    [`get_${kind}_workspaces`, userId],
    { tags: [workspaceListTag(kind, userId)] }
  )();
}

export async function getPrivateWorkspaces(userID: string) {
  return cachedWorkspaceList("private", userID, () =>
    db
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
      )
  );
}

export async function getCollaboratingWorkspaces(userId: string) {
  return cachedWorkspaceList("collaborating", userId, async () => {
    const data = await db
      .select()
      .from(collaborators)
      .innerJoin(workspaces, eq(collaborators.workspaceId, workspaces.id))
      .where(eq(collaborators.userId, userId));

    return data.map(({ workspaces }) => workspaces);
  });
}

export async function getSharedWorkspaces(userId: string) {
  return cachedWorkspaceList("shared", userId, async () => {
    const data = await db
      .selectDistinct()
      .from(workspaces)
      .orderBy(workspaces.createdAt)
      .innerJoin(collaborators, eq(workspaces.id, collaborators.workspaceId))
      .where(eq(workspaces.workspaceOwnerId, userId));

    return data.map(({ workspaces }) => workspaces);
  });
}
