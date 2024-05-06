"use server";

import { unstable_cache as cache, revalidateTag } from "next/cache";
import { and, eq, notExists } from "drizzle-orm";

import type { Workspace } from "@/types/db";

import { db } from "..";
import { collaborators, users, workspaces } from "../schema";

/**
 * Create workspace
 * @param workspace Workspace
 * @returns Created workspace
 */
export async function createWorkspace(workspace: Workspace) {
  try {
    const [data] = await db.insert(workspaces).values(workspace).returning();

    return data;
  } catch (e) {
    console.error((e as Error).message);
    throw new Error("Failed to create Workspace.");
  } finally {
    revalidateTag("get_private_workspaces");
    revalidateTag("get_collaborating_workspaces");
    revalidateTag("get_shared_workspaces");
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
