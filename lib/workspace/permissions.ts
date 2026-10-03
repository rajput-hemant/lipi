export type WorkspaceMembershipRole = "owner" | "editor" | "viewer";

export type WorkspacePermission =
  | "workspace:read"
  | "document:read"
  | "document:write"
  | "member:manage"
  | "workspace:settings"
  | "workspace:transfer"
  | "workspace:delete";

const ROLE_PERMISSIONS: Record<
  WorkspaceMembershipRole,
  readonly WorkspacePermission[]
> = {
  owner: [
    "workspace:read",
    "document:read",
    "document:write",
    "member:manage",
    "workspace:settings",
    "workspace:transfer",
    "workspace:delete",
  ],
  editor: ["workspace:read", "document:read", "document:write"],
  viewer: ["workspace:read", "document:read"],
};

export function workspaceRoleFromCollaborator(
  collaboratorRole: "editor" | "viewer"
): WorkspaceMembershipRole {
  return collaboratorRole;
}

export function resolveWorkspaceMembershipRole(
  userId: string,
  workspace: { workspaceOwnerId: string },
  collaboratorRole: "editor" | "viewer" | null
): WorkspaceMembershipRole | null {
  if (workspace.workspaceOwnerId === userId) {
    return "owner";
  }
  if (!collaboratorRole) {
    return null;
  }
  return workspaceRoleFromCollaborator(collaboratorRole);
}

export function hasWorkspacePermission(
  role: WorkspaceMembershipRole,
  permission: WorkspacePermission
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
