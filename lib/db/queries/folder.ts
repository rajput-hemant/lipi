"use server";

import { unstable_cache as cache, revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { validate } from "uuid";

import type { Folder } from "@/types/db";

import { db } from "..";
import { folders } from "../schema";

/**
 * Create a new folder
 * @param folder Folder
 * @returns Created folder
 */
export async function createFolder(folder: Folder) {
  try {
    const [data] = await db.insert(folders).values(folder).returning();

    return data;
  } catch (e) {
    console.error((e as Error).message);
    throw new Error("Failed to create folders");
  } finally {
    revalidateTag("get_folders");
  }
}

export const createFolderInDb = createFolder;

/**
 * Get workspace folders
 * @param workspaceId Workspace ID
 * @returns Workspace folders
 */
export const getFolders = cache(
  async (workspaceId: string) => {
    const isValid = validate(workspaceId);

    if (!isValid) {
      throw new Error("Invalid workspace ID");
    }

    try {
      const data = await db
        .select()
        .from(folders)
        .orderBy(folders.createdAt)
        .where(eq(folders.workspaceId, workspaceId));

      return data;
    } catch (e) {
      console.error((e as Error).message);
      throw new Error("Failed to fetch folders from the database");
    }
  },
  ["get_folders"],
  { tags: ["get_folders"] }
);

export const getFoldersFromDb = getFolders;

/**
 * Update folder
 * @param folder Folder
 * @returns Updated folder
 */
export async function updateFolder(folder: Folder) {
  try {
    const [data] = await db
      .update(folders)
      .set(folder)
      .where(eq(folders.id, folder.id!))
      .returning();

    return data;
  } catch (e) {
    console.error((e as Error).message);
    throw new Error("Failed to update folder.");
  } finally {
    revalidateTag("get_folders");
  }
}

export const updateFolderInDb = updateFolder;

/**
 * Delete folder by ID
 * @param folderId Folder ID
 * @returns Deleted folder
 */
export async function deleteFolder(folderId: string) {
  try {
    const [deletedFolder] = await db
      .delete(folders)
      .where(eq(folders.id, folderId))
      .returning();

    return deletedFolder;
  } catch (error) {
    console.error((error as Error).message);
    throw new Error("Failed to delete folder.");
  }
}

export const deleteFolderFromDb = deleteFolder;
