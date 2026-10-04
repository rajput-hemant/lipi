import { beforeEach, describe, expect, it, vi } from "vitest";

import { PlanQuotaError } from "@/lib/billing/errors";
import { MutationAuthError } from "../data/mutation-auth";

const mocks = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  assertUserCanCreateWorkspace: vi.fn(),
  returning: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag }));
vi.mock("@/lib/billing/enforce-quotas", () => ({
  assertUserCanCreateWorkspace: mocks.assertUserCanCreateWorkspace,
}));
vi.mock("../data/workspace-lists", () => ({
  listWorkspacesForSwitcher: vi.fn(),
}));
vi.mock("../data/mutation-auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../data/mutation-auth")>()),
  requireAuthenticatedUser: mocks.requireAuthenticatedUser,
}));
vi.mock("..", () => ({
  db: {
    insert: () => ({ values: () => ({ returning: mocks.returning }) }),
  },
}));
vi.mock("../schema", () => ({ workspaces: {} }));

const { createWorkspace } = await import("./workspace");

const workspace = { title: "Team", iconId: "x", workspaceOwnerId: "u1" };

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.requireAuthenticatedUser.mockResolvedValue({ id: "u1" });
});

describe("createWorkspace", () => {
  it("returns the created workspace", async () => {
    mocks.returning.mockResolvedValue([{ id: "w1", ...workspace }]);

    await expect(createWorkspace(workspace)).resolves.toEqual({
      ok: true,
      data: { id: "w1", ...workspace },
    });
  });

  it("returns a QUOTA_EXCEEDED result with the plan message", async () => {
    mocks.assertUserCanCreateWorkspace.mockRejectedValue(
      new PlanQuotaError("workspace", "Free plan allows one workspace.")
    );

    await expect(createWorkspace(workspace)).resolves.toEqual({
      ok: false,
      code: "QUOTA_EXCEEDED",
      message: "Free plan allows one workspace.",
    });
  });

  it("returns an UNAUTHORIZED result without a session", async () => {
    mocks.requireAuthenticatedUser.mockRejectedValue(
      new MutationAuthError("Unauthorized", "UNAUTHORIZED")
    );

    await expect(createWorkspace(workspace)).resolves.toMatchObject({
      ok: false,
      code: "UNAUTHORIZED",
    });
  });

  it("revalidates workspace list tags for the authenticated user only, ignoring forged owner IDs", async () => {
    mocks.returning.mockResolvedValue([{ id: "w1", ...workspace }]);

    await createWorkspace({
      title: "Team",
      iconId: "x",
      // @ts-expect-error intentionally testing runtime resistance to forged owner input
      workspaceOwnerId: "forged-victim-id",
    });

    expect(mocks.revalidateTag).toHaveBeenCalledWith(
      "get_private_workspaces_u1",
      "max"
    );
    expect(mocks.revalidateTag).toHaveBeenCalledWith(
      "get_collaborating_workspaces_u1",
      "max"
    );
    expect(mocks.revalidateTag).toHaveBeenCalledWith(
      "get_shared_workspaces_u1",
      "max"
    );
    expect(mocks.revalidateTag).not.toHaveBeenCalledWith(
      expect.stringContaining("forged-victim-id"),
      expect.anything()
    );
  });

  it("does not revalidate any cache tags when workspace creation fails", async () => {
    mocks.assertUserCanCreateWorkspace.mockRejectedValue(
      new PlanQuotaError("workspace", "Free plan allows one workspace.")
    );

    await createWorkspace({
      title: "Team",
      iconId: "x",
      // @ts-expect-error intentionally testing runtime resistance to forged owner input
      workspaceOwnerId: "forged-victim-id",
    });

    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });

  it("still throws a generic error for unexpected failures", async () => {
    mocks.returning.mockRejectedValue(new Error("db down"));

    await expect(createWorkspace(workspace)).rejects.toThrow(
      "Failed to create Workspace."
    );
  });
});
