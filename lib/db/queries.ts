"use server";

import { eq } from "drizzle-orm";
import { validate } from "uuid";

import type { Folder, Subscription, Workspace } from "@/types/db";
import { db } from ".";
import { folders, workspaces } from "./schema";

type Data<T> = { data: T; error: null } | { data: null; error: string };

/* -----------------------------------------------------------------------------------------------
 * Subscription
 * -----------------------------------------------------------------------------------------------*/

/**
 * Get user subscription status
 * @param userId User ID
 * @returns Subscription status
 */
export async function getUserSubscriptionStatus(
  userId: string
): Promise<Data<Subscription["status"]>> {
  try {
    const data = await db.query.subscriptions.findFirst({
      where: (s, { eq }) => eq(s.userId, userId),
    });

    return { data: data?.status ?? null, error: null };
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
): Promise<Data<Workspace>> {
  try {
    const [data] = await db.insert(workspaces).values(workspace).returning();

    return { data, error: null };
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
): Promise<Data<Folder[]>> => {
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
