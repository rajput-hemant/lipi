import { and, eq } from "drizzle-orm";

import type {
  WorkspaceMembershipRole,
  WorkspacePermission,
} from "@/lib/workspace/permissions";

import { getCurrentUser } from "@/lib/auth";
import {
  hasWorkspacePermission,
  resolveWorkspaceMembershipRole,
} from "@/lib/workspace/permissions";
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
  collaboratorUserIds: string[]
) {
  return (
    workspace.workspaceOwnerId === userId ||
    collaboratorUserIds.includes(userId)
  );
}

export async function getWorkspaceMembershipRole(
  userId: string,
  workspaceId: string
): Promise<{
  workspace: typeof workspaces.$inferSelect;
  role: WorkspaceMembershipRole;
}> {
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
  });

  if (!workspace) {
    throw new MutationAuthError("Workspace not found");
  }

  if (workspace.workspaceOwnerId === userId) {
    return { workspace, role: "owner" };
  }

  const collaborator = await db.query.collaborators.findFirst({
    where: and(
      eq(collaborators.workspaceId, workspaceId),
      eq(collaborators.userId, userId)
    ),
  });

  const role = resolveWorkspaceMembershipRole(
    userId,
    workspace,
    collaborator?.role ?? null
  );

  if (!role) {
    throw new MutationAuthError("Forbidden");
  }

  return { workspace, role };
}

export async function requireWorkspacePermission(
  userId: string,
  workspaceId: string,
  permission: WorkspacePermission
) {
  const { workspace, role } = await getWorkspaceMembershipRole(
    userId,
    workspaceId
  );

  if (!hasWorkspacePermission(role, permission)) {
    throw new MutationAuthError("Forbidden");
  }

  return { workspace, role };
}

export async function requireAuthenticatedUser() {
  const user = await getCurrentUser();
  if (!user) throw new MutationAuthError("Unauthorized");
  return user;
}

export async function assertWorkspaceAccess(
  userId: string,
  workspaceId: string | null | undefined
) {
  if (!workspaceId) {
    throw new MutationAuthError("Invalid workspace");
  }

  const { workspace } = await requireWorkspacePermission(
    userId,
    workspaceId,
    "workspace:read"
  );

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

export async function authorizeDocumentMutation(documentId: string) {
  const user = await requireAuthenticatedUser();
  const document = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
  });

  if (!document) {
    throw new MutationAuthError("Document not found");
  }

  await requireWorkspacePermission(
    user.id,
    document.workspaceId,
    "document:write"
  );

  return { user, document };
}

export async function authorizeWorkspaceMutation(
  workspaceId: string | null | undefined
) {
  const user = await requireAuthenticatedUser();
  if (!workspaceId) {
    throw new MutationAuthError("Invalid workspace");
  }
  await requireWorkspacePermission(user.id, workspaceId, "document:write");
  return user;
}

export async function authorizeWorkspaceOwnerAction(
  workspaceId: string | null | undefined
) {
  const user = await requireAuthenticatedUser();
  if (!workspaceId) {
    throw new MutationAuthError("Invalid workspace");
  }
  await requireWorkspacePermission(user.id, workspaceId, "workspace:settings");
  return user;
}

export async function authorizeWorkspaceMemberManagement(
  workspaceId: string | null | undefined
) {
  const user = await requireAuthenticatedUser();
  if (!workspaceId) {
    throw new MutationAuthError("Invalid workspace");
  }
  await requireWorkspacePermission(user.id, workspaceId, "member:manage");
  return user;
}

export async function authorizeWorkspaceTransfer(
  workspaceId: string | null | undefined
) {
  const user = await requireAuthenticatedUser();
  if (!workspaceId) {
    throw new MutationAuthError("Invalid workspace");
  }
  await requireWorkspacePermission(user.id, workspaceId, "workspace:transfer");
  return user;
}

export async function authorizeWorkspaceDelete(
  workspaceId: string | null | undefined
) {
  const user = await requireAuthenticatedUser();
  if (!workspaceId) {
    throw new MutationAuthError("Invalid workspace");
  }
  await requireWorkspacePermission(user.id, workspaceId, "workspace:delete");
  return user;
}
