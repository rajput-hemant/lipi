import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const { getCurrentUser, acceptWorkspaceInvite } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  acceptWorkspaceInvite: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser }));
vi.mock("@/lib/db/queries", () => ({ acceptWorkspaceInvite }));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

const call = () =>
  GET(new Request("http://app.test/invite/tok"), {
    params: Promise.resolve({ token: "tok" }),
  }).then(
    () => "no redirect",
    (e: Error) => e.message.replace("REDIRECT ", "")
  );

describe("GET /invite/[token]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends signed-out visitors to login and returns them here", async () => {
    getCurrentUser.mockResolvedValue(null);

    expect(await call()).toBe("/login?from=%2Finvite%2Ftok");
    expect(acceptWorkspaceInvite).not.toHaveBeenCalled();
  });

  it("lands on the invited workspace after accepting", async () => {
    getCurrentUser.mockResolvedValue({ id: "u" });
    acceptWorkspaceInvite.mockResolvedValue({ workspaceId: "ws-1" });

    expect(await call()).toBe("/dashboard/ws-1");
  });

  it("reports an invalid invite only when accepting fails", async () => {
    getCurrentUser.mockResolvedValue({ id: "u" });
    acceptWorkspaceInvite.mockRejectedValue(new Error("Invite not found"));

    expect(await call()).toBe("/dashboard?invite=invalid");
  });
});
