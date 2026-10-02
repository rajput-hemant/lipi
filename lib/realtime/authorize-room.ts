import { and, eq } from "drizzle-orm";

import type { RealtimeRoomAccess } from "./context";

import { db } from "@/lib/db";
import { collaborators, documents, workspaces } from "@/lib/db/schema";
import {
  hasWorkspacePermission,
  resolveWorkspaceMembershipRole,
} from "@/lib/workspace/permissions";
import { RealtimeAuthorizationError } from "./context";
import { parseRealtimeRoomName } from "./rooms";

export { RealtimeAuthorizationError } from "./context";

export async function authorizeRealtimeRoom(
  userId: string,
  roomName: string
): Promise<RealtimeRoomAccess> {
  const room = parseRealtimeRoomName(roomName);
  if (!room) throw new RealtimeAuthorizationError();

  const document =
    room.kind === "document" ?
      await db.query.documents.findFirst({
        where: eq(documents.id, room.id),
      })
    : null;

  if (room.kind === "document" && (!document || document.inTrash)) {
    throw new RealtimeAuthorizationError();
  }

  const workspaceId = document?.workspaceId ?? room.id;
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
  });

  if (!workspace || workspace.inTrash) {
    throw new RealtimeAuthorizationError();
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

  if (!role || !hasWorkspacePermission(role, "workspace:read")) {
    throw new RealtimeAuthorizationError();
  }

  if (
    room.kind === "document" &&
    !hasWorkspacePermission(role, "document:read")
  ) {
    throw new RealtimeAuthorizationError();
  }

  return {
    roomName,
    workspaceId,
    role,
    readOnly:
      room.kind === "workspace" ||
      !hasWorkspacePermission(role, "document:write"),
    documentId: document?.id ?? null,
  };
}
