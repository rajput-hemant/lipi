"use server";

import { and, eq } from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth";

import { db } from "..";
import { collaborators, files, folders, workspaces } from "../schema";

export class MutationAuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "MutationAuthError";
  }
}

export function isWorkspaceMember(
  userId: string,
  workspace: { workspaceOwnerId: string },
  collaboratorUserIds: string[],
) {
  return (
    workspace.workspaceOwnerId === userId ||
    collaboratorUserIds.includes(userId)
  );
}

export async function requireAuthenticatedUser() {
  const user = await getCurrentUser();
  if (!user) throw new MutationAuthError("Unauthorized");
  return user;
}

export async function assertWorkspaceAccess(
  userId: string,
  workspaceId: string | null | undefined,
) {
  if (!workspaceId) {
    throw new MutationAuthError("Invalid workspace");
  }

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
  });

  if (!workspace) {
    throw new MutationAuthError("Workspace not found");
  }

  if (workspace.workspaceOwnerId === userId) {
    return workspace;
  }

  const collaborator = await db.query.collaborators.findFirst({
    where: and(
      eq(collaborators.workspaceId, workspaceId),
      eq(collaborators.userId, userId),
    ),
  });

  if (!collaborator) {
    throw new MutationAuthError("Forbidden");
  }

  return workspace;
}

export async function assertFileAccess(userId: string, fileId: string) {
  const file = await db.query.files.findFirst({
    where: eq(files.id, fileId),
  });

  if (!file) {
    throw new MutationAuthError("File not found");
  }

  await assertWorkspaceAccess(userId, file.workspaceId);
  return file;
}

export async function assertFolderAccess(userId: string, folderId: string) {
  const folder = await db.query.folders.findFirst({
    where: eq(folders.id, folderId),
  });

  if (!folder) {
    throw new MutationAuthError("Folder not found");
  }

  await assertWorkspaceAccess(userId, folder.workspaceId);
  return folder;
}

export async function authorizeWorkspaceMutation(
  workspaceId: string | null | undefined,
) {
  const user = await requireAuthenticatedUser();
  await assertWorkspaceAccess(user.id, workspaceId);
  return user;
}

export async function authorizeFileMutation(fileId: string) {
  const user = await requireAuthenticatedUser();
  await assertFileAccess(user.id, fileId);
  return user;
}

export async function authorizeFolderMutation(folderId: string) {
  const user = await requireAuthenticatedUser();
  await assertFolderAccess(user.id, folderId);
  return user;
}
