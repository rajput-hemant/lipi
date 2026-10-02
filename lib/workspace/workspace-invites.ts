import type { WorkspaceMembershipRole } from "./permissions";

import { hasWorkspacePermission } from "./permissions";

export type PublicPendingInvite = {
  id: string;
  email: string;
  role: "editor" | "viewer";
  expiresAt: string;
};

type PendingInviteRow = {
  id: string;
  email: string;
  role: "editor" | "viewer";
  token: string;
  expiresAt: string;
};

export function publicPendingInvitesForRole(
  role: WorkspaceMembershipRole,
  rows: PendingInviteRow[]
): PublicPendingInvite[] {
  if (!hasWorkspacePermission(role, "member:manage")) {
    return [];
  }

  return rows.map(({ id, email, role: inviteRole, expiresAt }) => ({
    id,
    email,
    role: inviteRole,
    expiresAt,
  }));
}
