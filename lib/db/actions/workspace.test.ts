import { beforeEach, describe, expect, it, vi } from "vitest";

import { PlanQuotaError } from "@/lib/billing/errors";
import { MutationAuthError } from "../data/mutation-auth";

const mocks = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  assertUserCanCreateWorkspace: vi.fn(),
  returning: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
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

  it("still throws a generic error for unexpected failures", async () => {
    mocks.returning.mockRejectedValue(new Error("db down"));

    await expect(createWorkspace(workspace)).rejects.toThrow(
      "Failed to create Workspace."
    );
  });
});
