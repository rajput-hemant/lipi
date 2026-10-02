import { describe, expect, it } from "vitest";

import type {
  WorkspaceMembershipRole,
  WorkspacePermission,
} from "./permissions";

import { hasWorkspacePermission } from "./permissions";

const ROLES: WorkspaceMembershipRole[] = ["owner", "editor", "viewer"];

const PERMISSIONS: WorkspacePermission[] = [
  "workspace:read",
  "document:read",
  "document:write",
  "member:manage",
  "workspace:settings",
  "workspace:transfer",
  "workspace:delete",
];

const EXPECTED: Record<WorkspaceMembershipRole, WorkspacePermission[]> = {
  owner: PERMISSIONS,
  editor: ["workspace:read", "document:read", "document:write"],
  viewer: ["workspace:read", "document:read"],
};

describe("workspace authorization matrix", () => {
  for (const role of ROLES) {
    for (const permission of PERMISSIONS) {
      it(`${role} ${EXPECTED[role].includes(permission) ? "allows" : "denies"} ${permission}`, () => {
        expect(hasWorkspacePermission(role, permission)).toBe(
          EXPECTED[role].includes(permission)
        );
      });
    }
  }

  it("treats forged workspace URLs as unauthorized at the permission layer", () => {
    expect(hasWorkspacePermission("viewer", "document:write")).toBe(false);
    expect(hasWorkspacePermission("editor", "member:manage")).toBe(false);
  });
});
