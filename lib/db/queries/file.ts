"use server";

import { unstable_cache as cache, revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { validate } from "uuid";

import type { File } from "@/types/db";

import { db } from "..";
import { files } from "../schema";

/**
 * Create a new file
 * @param file - File object
 * @returns Created file
 */
export async function createFile(file: File) {
  try {
    const [data] = await db.insert(files).values(file).returning();

    return data;
  } catch (e) {
    console.error((e as Error).message);
    throw new Error("Failed to create file");
  } finally {
    revalidateTag("get_files");
  }
}

/**
 * Get all files in a workspace
 * @param workspaceId - ID of the workspace
 * @returns List of files in the workspace
 */
export const getFiles = cache(
  async (workspaceId: string) => {
    const isValid = validate(workspaceId);

    if (!isValid) {
      throw new Error("Invalid workspace ID");
    }

    try {
      const data = await db
        .select()
        .from(files)
        .orderBy(files.createdAt)
        .where(eq(files.workspaceId, workspaceId));

      return data;
    } catch (e) {
      console.error((e as Error).message);
      throw new Error("Failed to fetch files from the database");
    }
  },
  ["get_files"],
  { tags: ["get_files"] }
);

export const getFilesFromDb = getFiles;

/**
 * Update a file
 * @param file - File object
 * @returns Updated file
 */
export async function updateFile(file: File) {
  try {
    const [updatedFile] = await db
      .update(files)
      .set(file)
      .where(eq(files.id, file.id!))
      .returning();

    return updatedFile;
  } catch (e) {
    console.error((e as Error).message);
    throw new Error("Failed to update file");
  } finally {
    revalidateTag("get_files");
  }
}

export const updateFileInDb = updateFile;

/**
 * Delete file by ID
 * @param fileId Folder ID
 * @returns Deleted file
 */
export async function deleteFile(fileId: string) {
  try {
    const [deletedFile] = await db
      .delete(files)
      .where(eq(files.id, fileId))
      .returning();

    return deletedFile;
  } catch (e) {
    console.error((e as Error).message);
    throw new Error("Failed to delete file");
  }
}

export const deleteFileFromDb = deleteFile;
