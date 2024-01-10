"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { validate } from "uuid";

import type { DBResponse } from ".";
import type { File } from "@/types/db";

import { db } from "..";
import { files } from "../schema";

/**
 * Get all files in a workspace
 * @param workspaceId - ID of the workspace
 * @returns List of files in the workspace
 */
export async function getFiles(
  workspaceId: string
): Promise<DBResponse<File[]>> {
  const isValid = validate(workspaceId);

  if (!isValid) return { error: "Invalid workspace ID", data: null };

  try {
    const data = await db
      .select()
      .from(files)
      .orderBy(files.createdAt)
      .where(eq(files.workspaceId, workspaceId));

    return { data, error: null };
  } catch (error) {
    return { error: (error as Error).message, data: null };
  }
}

// /**
//  * Get all files in a folder
//  * @param folderId - ID of the folder
//  * @returns - Array of files
//  */
// export async function getFiles (
//   folderId: string
// ): Promise<DBResponse<File[]>> {
//   const isValid = validate(folderId);

//   if (!isValid) return { error: "Invalid Folder ID", data: null };

//   try {
//     const data = await db
//       .select()
//       .from(files)
//       .orderBy(files.createdAt)
//       .where(eq(files.folderId, folderId));

//     return { data, error: null };
//   } catch (error) {
//     return { error: (error as Error).message, data: null };
//   }
// };

/**
 * Create a new folder
 * @param folder Folder
 * @returns Created folder
 */
export async function createFile(file: File): Promise<DBResponse<File>> {
  try {
    const [data] = await db.insert(files).values(file).returning();

    return { data, error: null };
  } catch (error) {
    return { error: (error as Error).message, data: null };
  } finally {
    revalidatePath(`/dashboard/${file.workspaceId}`);
  }
}

/**
 * Delete file by ID
 * @param fileId Folder ID
 * @returns Deleted file
 */
export async function deleteFile(fileId: string): Promise<DBResponse<File>> {
  try {
    const [deletedFile] = await db
      .delete(files)
      .where(eq(files.id, fileId))
      .returning();

    return { data: deletedFile, error: null };
  } catch (error) {
    return { error: (error as Error).message, data: null };
  }
}
