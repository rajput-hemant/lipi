import { beforeEach, describe, expect, it, vi } from "vitest";

import DashboardPage from "./page";

const { getCurrentUser, getDefaultWorkspaceId } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getDefaultWorkspaceId: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser }));
vi.mock("@/lib/db/queries", () => ({ getDefaultWorkspaceId }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

const call = (searchParams: { invite?: string | string[] }) =>
  DashboardPage({ searchParams: Promise.resolve(searchParams) }).then(
    () => "no redirect",
    (e: Error) => e.message.replace("REDIRECT ", "")
  );

describe("/dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUser.mockResolvedValue({ id: "u" });
  });

  it("redirects to the default workspace", async () => {
    getDefaultWorkspaceId.mockResolvedValue("ws-1");

    expect(await call({})).toBe("/dashboard/ws-1");
  });

  it("forwards an invalid-invite flag to the workspace", async () => {
    getDefaultWorkspaceId.mockResolvedValue("ws-1");

    expect(await call({ invite: "invalid" })).toBe(
      "/dashboard/ws-1?invite=invalid"
    );
  });

  it("forwards the flag to workspace creation when there is no workspace", async () => {
    getDefaultWorkspaceId.mockResolvedValue(null);

    expect(await call({ invite: "invalid" })).toBe(
      "/dashboard/new-workspace?invite=invalid"
    );
  });

  it("ignores any other invite value", async () => {
    getDefaultWorkspaceId.mockResolvedValue("ws-1");

    expect(await call({ invite: "<script>" })).toBe("/dashboard/ws-1");
  });
});
