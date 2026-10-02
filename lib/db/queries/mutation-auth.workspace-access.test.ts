import { beforeEach, describe, expect, it, vi } from "vitest";

import { MutationAuthError, requireWorkspacePermission } from "./mutation-auth";

const { findWorkspace, findCollaborator } = vi.hoisted(() => ({
  findWorkspace: vi.fn(),
  findCollaborator: vi.fn(),
}));

vi.mock("..", () => ({
  db: {
    query: {
      workspaces: { findFirst: findWorkspace },
      collaborators: { findFirst: findCollaborator },
    },
  },
}));

describe("requireWorkspacePermission workspace id enforcement", () => {
  beforeEach(() => {
    findWorkspace.mockReset();
    findCollaborator.mockReset();
  });

  it("rejects forged workspace ids when the workspace does not exist", async () => {
    findWorkspace.mockResolvedValue(undefined);

    await expect(
      requireWorkspacePermission(
        "user-1",
        "forged-workspace-id",
        "workspace:read"
      )
    ).rejects.toMatchObject({ message: "Workspace not found" });
  });

  it("rejects unrelated users for an existing workspace id", async () => {
    findWorkspace.mockResolvedValue({
      id: "ws-real",
      workspaceOwnerId: "owner-id",
    });
    findCollaborator.mockResolvedValue(undefined);

    await expect(
      requireWorkspacePermission("attacker-id", "ws-real", "workspace:read")
    ).rejects.toMatchObject({ message: "Forbidden" });
  });
});
