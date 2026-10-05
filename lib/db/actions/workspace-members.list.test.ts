import { beforeEach, describe, expect, it, vi } from "vitest";

import { MutationAuthError } from "../data/mutation-auth";

const mocks = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  requireWorkspacePermission: vi.fn(),
}));

vi.mock("..", () => ({ db: {} }));
vi.mock("../data/mutation-auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../data/mutation-auth")>()),
  requireAuthenticatedUser: mocks.requireAuthenticatedUser,
  requireWorkspacePermission: mocks.requireWorkspacePermission,
}));
vi.mock("@/lib/workspace/send-invite", () => ({
  sendWorkspaceInviteEmail: vi.fn(),
}));
vi.mock("@/lib/auth/resolve-auth-base-url", () => ({
  resolveAuthBaseURL: vi.fn(),
}));

const { listWorkspaceMembers } = await import("./workspace-members");

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthenticatedUser.mockResolvedValue({ id: "u1" });
});

describe("listWorkspaceMembers", () => {
  it("returns a serializable FORBIDDEN result instead of throwing", async () => {
    mocks.requireWorkspacePermission.mockRejectedValue(
      new MutationAuthError("Forbidden", "FORBIDDEN")
    );

    const result = await listWorkspaceMembers("ws-1");

    // Server action results cross the wire as JSON; thrown messages do not.
    expect(JSON.parse(JSON.stringify(result))).toEqual({
      ok: false,
      code: "FORBIDDEN",
      message: "You do not have permission to do that.",
    });
  });

  it("returns an UNAUTHORIZED result when the session is gone", async () => {
    mocks.requireAuthenticatedUser.mockRejectedValue(
      new MutationAuthError("Unauthorized", "UNAUTHORIZED")
    );

    await expect(listWorkspaceMembers("ws-1")).resolves.toMatchObject({
      ok: false,
      code: "UNAUTHORIZED",
    });
  });

  it("still throws unexpected failures", async () => {
    mocks.requireWorkspacePermission.mockRejectedValue(new Error("db down"));

    await expect(listWorkspaceMembers("ws-1")).rejects.toThrow("db down");
  });
});
