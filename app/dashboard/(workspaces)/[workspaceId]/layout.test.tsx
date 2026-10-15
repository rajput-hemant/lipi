import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorkspaceAccessRevoked } from "@/components/workspace-access-revoked";
import { MutationAuthError } from "@/lib/db/data/mutation-auth";
import { WorkspaceLayout } from "./layout";

const { getCurrentUser, getWorkspaceMembershipRole, notFound } = vi.hoisted(
  () => ({
    getCurrentUser: vi.fn(),
    getWorkspaceMembershipRole: vi.fn(),
    notFound: vi.fn(() => {
      throw new Error("NEXT_NOT_FOUND");
    }),
  })
);

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn(), notFound }));
vi.mock("@/lib/auth", () => ({ getCurrentUser }));
vi.mock("@/lib/db/actions/document", () => ({
  getDocuments: vi.fn(async () => []),
}));
vi.mock("@/lib/db/data/mutation-auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/db/data/mutation-auth")>()),
  getWorkspaceMembershipRole,
}));
vi.mock("@/components/app-state-provider", () => ({
  AppStateProvider: () => null,
}));
vi.mock("@/components/realtime/workspace-realtime-provider", () => ({
  WorkspaceRealtimeProvider: () => null,
}));
vi.mock("../components/workspace-shell", () => ({
  WorkspaceShell: () => null,
}));

const renderLayout = () =>
  WorkspaceLayout({
    params: Promise.resolve({ workspaceId: "ws-1" }),
    children: null,
  });

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue({ id: "user-1" });
});

describe("WorkspaceLayout for a removed member", () => {
  it("renders the access-revoked state when membership is forbidden", async () => {
    getWorkspaceMembershipRole.mockRejectedValue(
      new MutationAuthError("Forbidden", "FORBIDDEN")
    );

    const element = (await renderLayout()) as { type: unknown };

    expect(element.type).toBe(WorkspaceAccessRevoked);
  });

  it("calls notFound when the workspace does not exist", async () => {
    getWorkspaceMembershipRole.mockRejectedValue(
      new MutationAuthError("Workspace not found")
    );

    await expect(renderLayout()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledOnce();
  });

  it("rethrows other membership errors to the error boundary", async () => {
    const error = new Error("database unavailable");
    getWorkspaceMembershipRole.mockRejectedValue(error);

    await expect(renderLayout()).rejects.toBe(error);
  });
});
