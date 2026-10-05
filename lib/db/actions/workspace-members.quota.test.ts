import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  acceptWorkspaceInvite,
  createWorkspaceCollaboratorInvite,
} from "./workspace-members";

const mocks = vi.hoisted(() => ({
  assertQuota: vi.fn(),
  authorizeWorkspaceMemberManagement: vi.fn(),
  requireAuthenticatedUser: vi.fn(),
  findWorkspace: vi.fn(),
  findInvite: vi.fn(),
  findUser: vi.fn(),
  findCollaborator: vi.fn(),
  transaction: {
    query: { collaborators: { findFirst: vi.fn() } },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
      })),
    })),
    delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
  },
}));

vi.mock("../data/workspace-member-quota", () => ({
  withOwnerCollaboratorLock: vi.fn(
    (
      _ownerId: string,
      work: (transaction: unknown, assertQuota: () => void) => unknown
    ) => work(mocks.transaction, mocks.assertQuota)
  ),
}));

vi.mock("../data/mutation-auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../data/mutation-auth")>()),
  authorizeWorkspaceMemberManagement: mocks.authorizeWorkspaceMemberManagement,
  requireAuthenticatedUser: mocks.requireAuthenticatedUser,
  requireWorkspacePermission: vi.fn(),
  getWorkspaceMembershipRole: vi.fn(),
}));

vi.mock("@/lib/workspace/send-invite", () => ({
  sendWorkspaceInviteEmail: vi.fn(),
}));

vi.mock("@/lib/auth/resolve-auth-base-url", () => ({
  resolveAuthBaseURL: () => "http://localhost:3000",
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

vi.mock("..", () => ({
  db: {
    query: {
      workspaces: { findFirst: mocks.findWorkspace },
      workspaceInvites: { findFirst: mocks.findInvite },
      users: { findFirst: mocks.findUser },
      collaborators: { findFirst: mocks.findCollaborator },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoUpdate: vi.fn(() => Promise.resolve()),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
  },
}));

vi.mock("../schema", () => ({
  collaborators: {},
  users: {},
  workspaceInvites: {},
  workspaces: {},
}));

const workspaceId = "11111111-1111-4111-8111-111111111111";

describe("workspace member invite quota enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authorizeWorkspaceMemberManagement.mockResolvedValue({
      id: "owner-1",
    });
    mocks.requireAuthenticatedUser.mockResolvedValue({ id: "invitee-1" });
    mocks.assertQuota.mockResolvedValue(undefined);
    mocks.transaction.query.collaborators.findFirst.mockResolvedValue(
      undefined
    );
    mocks.findWorkspace.mockResolvedValue({
      id: workspaceId,
      workspaceOwnerId: "owner-1",
      title: "Team",
    });
    mocks.findUser.mockResolvedValue({ email: "invitee@example.com" });
    mocks.findInvite.mockResolvedValue({
      id: "invite-1",
      workspaceId,
      email: "invitee@example.com",
      role: "editor",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    mocks.findCollaborator.mockResolvedValue(undefined);
  });

  it("checks owner quota before creating an invite", async () => {
    await expect(
      createWorkspaceCollaboratorInvite({
        workspaceId,
        email: "new@example.com",
        role: "editor",
      })
    ).resolves.toMatchObject({ ok: true });

    expect(mocks.assertQuota).toHaveBeenCalledWith({
      workspaceId,
      email: "new@example.com",
    });
  });

  it("checks owner quota before accepting an invite", async () => {
    await acceptWorkspaceInvite("token-1");

    expect(mocks.assertQuota).toHaveBeenCalledWith();
  });

  it("returns quota errors when creating an invite", async () => {
    const { MutationAuthError } = await import("../data/mutation-auth");
    mocks.assertQuota.mockRejectedValue(
      new MutationAuthError("Free plan allows two collaborators.")
    );

    await expect(
      createWorkspaceCollaboratorInvite({
        workspaceId,
        email: "new@example.com",
        role: "editor",
      })
    ).resolves.toEqual({
      ok: false,
      code: "INVALID",
      message: "Free plan allows two collaborators.",
    });
  });

  it("surfaces quota errors when accepting an invite", async () => {
    const { MutationAuthError } = await import("../data/mutation-auth");
    mocks.assertQuota.mockRejectedValue(
      new MutationAuthError("Free plan allows two collaborators.")
    );

    await expect(acceptWorkspaceInvite("token-1")).rejects.toThrow(
      "Free plan allows two collaborators."
    );
  });
});
