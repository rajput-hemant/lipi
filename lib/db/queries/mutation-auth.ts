"use server";

import { and, eq } from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth";

import { db } from "..";
import { collaborators, documents, workspaces } from "../schema";

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

export async function assertDocumentAccess(userId: string, documentId: string) {
  const document = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
  });

  if (!document) {
    throw new MutationAuthError("Document not found");
  }

  await assertWorkspaceAccess(userId, document.workspaceId);
  return document;
}

export async function authorizeWorkspaceMutation(
  workspaceId: string | null | undefined,
) {
  const user = await requireAuthenticatedUser();
  await assertWorkspaceAccess(user.id, workspaceId);
  return user;
}

export async function authorizeDocumentMutation(documentId: string) {
  const user = await requireAuthenticatedUser();
  await assertDocumentAccess(user.id, documentId);
  return user;
}
