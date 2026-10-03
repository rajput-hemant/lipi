import { beforeEach, describe, expect, it, vi } from "vitest";

import { PlanQuotaError } from "@/lib/billing/errors";
import { MutationAuthError } from "./mutation-auth";

const mocks = vi.hoisted(() => ({
  authorizeWorkspaceOwnerAction: vi.fn(),
  authorizeWorkspaceTransfer: vi.fn(),
  authorizeWorkspaceDelete: vi.fn(),
  authorizeWorkspaceMemberManagement: vi.fn(),
  deleteReturning: vi.fn(),
  updateReturning: vi.fn(),
  selectLimit: vi.fn(),
  assertReceive: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/billing/enforce-quotas", () => ({
  assertUserCanReceiveWorkspaceTransfer: mocks.assertReceive,
}));
vi.mock("./mutation-auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./mutation-auth")>()),
  authorizeWorkspaceOwnerAction: mocks.authorizeWorkspaceOwnerAction,
  authorizeWorkspaceTransfer: mocks.authorizeWorkspaceTransfer,
  authorizeWorkspaceDelete: mocks.authorizeWorkspaceDelete,
  authorizeWorkspaceMemberManagement: mocks.authorizeWorkspaceMemberManagement,
}));
vi.mock("@/lib/workspace/send-invite", () => ({
  sendWorkspaceInviteEmail: vi.fn(),
}));
vi.mock("@/lib/auth/resolve-auth-base-url", () => ({
  resolveAuthBaseURL: () => "http://localhost:3000",
}));
vi.mock("..", () => ({
  db: {
    select: () => ({
      from: () => ({ where: () => ({ limit: mocks.selectLimit }) }),
    }),
    update: () => ({
      set: () => ({ where: () => ({ returning: mocks.updateReturning }) }),
    }),
    delete: () => ({ where: () => ({ returning: mocks.deleteReturning }) }),
  },
}));
vi.mock("../schema", () => ({
  collaborators: {},
  users: {},
  workspaceInvites: {},
  workspaces: {},
}));

const { deleteWorkspace, transferWorkspaceOwnership, updateWorkspaceSettings } =
  await import("./workspace-settings");
const { removeWorkspaceMember, updateCollaboratorRole } =
  await import("./workspace-members");

const workspaceId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const forbidden = () => new MutationAuthError("Forbidden", "FORBIDDEN");
const denied = {
  ok: false,
  code: "FORBIDDEN",
  message: "You do not have permission to do that.",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.authorizeWorkspaceOwnerAction.mockResolvedValue({ id: "owner" });
  mocks.authorizeWorkspaceTransfer.mockResolvedValue({ id: "owner" });
  mocks.authorizeWorkspaceDelete.mockResolvedValue({ id: "owner" });
  mocks.authorizeWorkspaceMemberManagement.mockResolvedValue({ id: "owner" });
});

describe("workspace settings actions", () => {
  it("returns FORBIDDEN results for every denied action", async () => {
    mocks.authorizeWorkspaceOwnerAction.mockRejectedValue(forbidden());
    mocks.authorizeWorkspaceTransfer.mockRejectedValue(forbidden());
    mocks.authorizeWorkspaceDelete.mockRejectedValue(forbidden());
    mocks.authorizeWorkspaceMemberManagement.mockRejectedValue(forbidden());

    await expect(
      updateWorkspaceSettings({ workspaceId, title: "New" })
    ).resolves.toEqual(denied);
    await expect(
      transferWorkspaceOwnership({ workspaceId, newOwnerUserId: userId })
    ).resolves.toEqual(denied);
    await expect(deleteWorkspace({ workspaceId })).resolves.toEqual(denied);
    await expect(
      updateCollaboratorRole({
        workspaceId,
        collaboratorId: userId,
        role: "viewer",
      })
    ).resolves.toEqual(denied);
    await expect(
      removeWorkspaceMember({ workspaceId, collaboratorId: userId })
    ).resolves.toEqual(denied);
  });

  it("returns validation messages as INVALID results", async () => {
    mocks.deleteReturning.mockResolvedValue([]);
    mocks.updateReturning.mockResolvedValue([]);

    await expect(deleteWorkspace({ workspaceId })).resolves.toEqual({
      ok: false,
      code: "INVALID",
      message: "Workspace not found",
    });
    await expect(
      updateCollaboratorRole({
        workspaceId,
        collaboratorId: userId,
        role: "editor",
      })
    ).resolves.toMatchObject({ message: "Collaborator not found" });
    await expect(
      transferWorkspaceOwnership({ workspaceId, newOwnerUserId: "owner" })
    ).rejects.toThrow();
  });

  it("rejects transferring to the current owner or a non-member", async () => {
    mocks.authorizeWorkspaceTransfer.mockResolvedValue({ id: userId });
    await expect(
      transferWorkspaceOwnership({ workspaceId, newOwnerUserId: userId })
    ).resolves.toMatchObject({
      ok: false,
      message: "Choose a different member",
    });

    mocks.selectLimit.mockResolvedValue([]);
    await expect(
      transferWorkspaceOwnership({
        workspaceId,
        newOwnerUserId: "33333333-3333-4333-8333-333333333333",
      })
    ).resolves.toMatchObject({
      ok: false,
      message: "New owner must be an existing collaborator",
    });
  });

  it("returns QUOTA_EXCEEDED when the new owner cannot hold the workspace", async () => {
    mocks.selectLimit.mockResolvedValue([{ id: "c1" }]);
    mocks.assertReceive.mockRejectedValue(
      new PlanQuotaError("collaborator", "Ask them to upgrade to Pro")
    );

    await expect(
      transferWorkspaceOwnership({
        workspaceId,
        newOwnerUserId: "33333333-3333-4333-8333-333333333333",
      })
    ).resolves.toEqual({
      ok: false,
      code: "QUOTA_EXCEEDED",
      message: "Ask them to upgrade to Pro",
    });
  });

  it("wraps successful results", async () => {
    mocks.deleteReturning.mockResolvedValue([{ id: workspaceId }]);

    await expect(deleteWorkspace({ workspaceId })).resolves.toEqual({
      ok: true,
      data: { id: workspaceId },
    });
  });
});
