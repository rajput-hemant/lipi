import { revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "..";
import { collaborators, workspaces } from "../schema";

// Not a "use server" module: these take caller-supplied ids and must never be
// reachable as Server Action endpoints.

export type WorkspaceListKind = "private" | "collaborating" | "shared";

const WORKSPACE_LIST_KINDS: WorkspaceListKind[] = [
  "private",
  "collaborating",
  "shared",
];

/** Cache tag of one user's workspace list. */
export function workspaceListTag(kind: WorkspaceListKind, userId: string) {
  return `get_${kind}_workspaces_${userId}`;
}

export function revalidateWorkspaceLists(
  userIds: Iterable<string | null | undefined>
) {
  for (const userId of new Set(userIds)) {
    if (!userId) continue;
    for (const kind of WORKSPACE_LIST_KINDS) {
      revalidateTag(workspaceListTag(kind, userId), "max");
    }
  }
}

export async function getWorkspaceOwnerId(workspaceId: string) {
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
    columns: { workspaceOwnerId: true },
  });
  return workspace?.workspaceOwnerId;
}

/** The owner and every collaborator: all users whose lists show the workspace. */
export async function getWorkspaceListAudience(workspaceId: string) {
  const [ownerId, members] = await Promise.all([
    getWorkspaceOwnerId(workspaceId),
    db
      .select({ userId: collaborators.userId })
      .from(collaborators)
      .where(eq(collaborators.workspaceId, workspaceId)),
  ]);
  return [...(ownerId ? [ownerId] : []), ...members.map((m) => m.userId)];
}
