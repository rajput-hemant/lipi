import { notFound } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorkspaceAccessRevoked } from "@/components/workspace-access-revoked";
import {
  getWorkspaceOrThrow,
  MutationAuthError,
  WorkspaceNotFoundError,
} from "@/lib/db/data/mutation-auth";
import { WorkspaceLayout } from "./layout";

const { findWorkspace, getCurrentUser, getWorkspaceMembershipRole } =
  vi.hoisted(() => ({
    findWorkspace: vi.fn(),
    getCurrentUser: vi.fn(),
    getWorkspaceMembershipRole: vi.fn(),
  }));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  }),
}));
vi.mock("@/lib/auth", () => ({ getCurrentUser }));
vi.mock("@/lib/db", () => ({
  db: { query: { workspaces: { findFirst: findWorkspace } } },
}));
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

  it("rethrows other membership errors to the error boundary", async () => {
    const error = new MutationAuthError("Something else", "INVALID");
    getWorkspaceMembershipRole.mockRejectedValue(error);

    await expect(renderLayout()).rejects.toBe(error);
  });
});

describe("WorkspaceLayout for a nonexistent workspace", () => {
  it("gets a typed error from an absent workspace row", async () => {
    findWorkspace.mockResolvedValue(undefined);

    await expect(getWorkspaceOrThrow("ws-missing")).rejects.toBeInstanceOf(
      WorkspaceNotFoundError
    );
  });

  it("invokes the not-found boundary for the typed missing-workspace error", async () => {
    const error = new WorkspaceNotFoundError();
    error.message = "The workspace no longer exists";
    getWorkspaceMembershipRole.mockRejectedValue(error);

    await expect(renderLayout()).rejects.toThrow(
      "NEXT_HTTP_ERROR_FALLBACK;404"
    );
    expect(notFound).toHaveBeenCalledOnce();
  });

  it("does not classify an unrelated error by its message", async () => {
    const error = new MutationAuthError("Workspace not found");
    getWorkspaceMembershipRole.mockRejectedValue(error);

    await expect(renderLayout()).rejects.toBe(error);
    expect(notFound).not.toHaveBeenCalled();
  });
});
