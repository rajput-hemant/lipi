"use server";

import { revalidatePath } from "next/cache";
import { and, eq, notExists } from "drizzle-orm";
import { validate } from "uuid";

import type { Folder, Subscription, Workspace } from "@/types/db";
import { db } from ".";
import { collaborators, folders, users, workspaces } from "./schema";

type DBResponse<T> = { data: T; error: null } | { data: null; error: string };

/* -----------------------------------------------------------------------------------------------
 * Subscription
 * -----------------------------------------------------------------------------------------------*/

/**
 * Get user subscription
 * @param userId User ID
 * @returns Subscription
 */
export async function getUserSubscription(
  userId: string
): Promise<DBResponse<Omit<Subscription, "prices">>> {
  try {
    const data = await db.query.subscriptions.findFirst({
      where: (s, { eq }) => eq(s.userId, userId),
    });

    if (!data) return { data: null, error: "Subscription not found" };

    return { data, error: null };
  } catch (error) {
    return { error: (error as Error).message, data: null };
  }
}

/* -----------------------------------------------------------------------------------------------
 * Workspace
 * -----------------------------------------------------------------------------------------------*/

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

/* -----------------------------------------------------------------------------------------------
 * Folder
 * -----------------------------------------------------------------------------------------------*/

/**
 * Get workspace folders
 * @param workspaceId Workspace ID
 * @returns Workspace folders
 */
export const getFolders = async (
  workspaceId: string
): Promise<DBResponse<Folder[]>> => {
  const isValid = validate(workspaceId);

  if (!isValid) return { error: "Invalid workspace ID", data: null };

  try {
    const data = await db
      .select()
      .from(folders)
      .orderBy(folders.createdAt)
      .where(eq(folders.workspaceId, workspaceId));

    return { data, error: null };
  } catch (error) {
    return { error: (error as Error).message, data: null };
  }
};

/**
 * @param folder Folder
 * @returns Created folder
 */
export const createFolder = async (
  folder: Folder
): Promise<DBResponse<Folder>> => {
  try {
    const [data] = await db.insert(folders).values(folder).returning();

    return { data, error: null };
  } catch (error) {
    return { error: (error as Error).message, data: null };
  } finally {
    revalidatePath(`/dashboard/${folder.workspaceId}`);
  }
};
