import { describe, expect, it } from "vitest";

import {
  hasWorkspacePermission,
  resolveWorkspaceMembershipRole,
} from "./permissions";

const workspace = { workspaceOwnerId: "owner-id" };

describe("resolveWorkspaceMembershipRole", () => {
  it("returns owner for the workspace owner", () => {
    expect(resolveWorkspaceMembershipRole("owner-id", workspace, null)).toBe(
      "owner",
    );
  });

  it("returns editor for editor collaborators", () => {
    expect(
      resolveWorkspaceMembershipRole("user-1", workspace, "editor"),
    ).toBe("editor");
  });

  it("returns viewer for viewer collaborators", () => {
    expect(
      resolveWorkspaceMembershipRole("user-1", workspace, "viewer"),
    ).toBe("viewer");
  });

  it("returns null for unrelated users", () => {
    expect(resolveWorkspaceMembershipRole("other", workspace, null)).toBeNull();
  });
});

describe("hasWorkspacePermission", () => {
  const actions = [
    ["workspace:read", { owner: true, editor: true, viewer: true }],
    ["document:write", { owner: true, editor: true, viewer: false }],
    ["member:manage", { owner: true, editor: false, viewer: false }],
    ["workspace:settings", { owner: true, editor: false, viewer: false }],
    ["workspace:transfer", { owner: true, editor: false, viewer: false }],
    ["workspace:delete", { owner: true, editor: false, viewer: false }],
  ] as const;

  for (const [permission, matrix] of actions) {
    it(`enforces ${permission}`, () => {
      expect(hasWorkspacePermission("owner", permission)).toBe(matrix.owner);
      expect(hasWorkspacePermission("editor", permission)).toBe(matrix.editor);
      expect(hasWorkspacePermission("viewer", permission)).toBe(matrix.viewer);
    });
  }
});
