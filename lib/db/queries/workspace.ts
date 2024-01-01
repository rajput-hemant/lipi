"use server";

import { and, eq, notExists } from "drizzle-orm";

import type { Workspace } from "@/types/db";
import type { DBResponse } from ".";
import { db } from "..";
import { collaborators, users, workspaces } from "../schema";

/**
 * Create workspace
 * @param workspace Workspace
 * @returns Created workspace
 */
export async function createWorkspace(
  workspace: Workspace
): Promise<DBResponse<Workspace>> {
  try {
    const [data] = await db.insert(workspaces).values(workspace).returning();

    return { data, error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * @param userID User ID
 * @returns Private workspaces
 */
export async function getPrivateWorkspaces(
  userID: string
): Promise<DBResponse<Workspace[]>> {
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

    return { data, error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * @param userId User ID
 * @returns Collaborating workspaces
 */
export async function getCollaboratingWorkspaces(
  userId: string
): Promise<DBResponse<Workspace[]>> {
  try {
    const data = await db
      .select()
      .from(users)
      .innerJoin(collaborators, eq(users.id, collaborators.userId))
      .innerJoin(workspaces, eq(collaborators.workspaceId, workspaces.id))
      .where(eq(users.id, userId));

    return { data: data.map(({ workspaces }) => workspaces), error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * @param userId User ID
 * @returns Shared workspaces
 */
export async function getSharedWorkspaces(
  userId: string
): Promise<DBResponse<Workspace[]>> {
  try {
    const data = await db
      .selectDistinct()
      .from(workspaces)
      .orderBy(workspaces.createdAt)
      .innerJoin(collaborators, eq(workspaces.id, collaborators.workspaceId))
      .where(eq(workspaces.workspaceOwnerId, userId));

    return { data: data.map(({ workspaces }) => workspaces), error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}
