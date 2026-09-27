import { describe, expect, it } from "vitest";

import { publicPendingInvitesForRole } from "./workspace-invites";

const inviteRow = {
  id: "invite-1",
  email: "guest@example.com",
  role: "editor" as const,
  token: "secret-token",
  expiresAt: "2099-01-01T00:00:00.000Z",
};

describe("publicPendingInvitesForRole", () => {
  it("omits tokens for owners", () => {
    const pending = publicPendingInvitesForRole("owner", [inviteRow]);
    expect(pending).toEqual([
      {
        id: "invite-1",
        email: "guest@example.com",
        role: "editor",
        expiresAt: "2099-01-01T00:00:00.000Z",
      },
    ]);
    expect(JSON.stringify(pending)).not.toContain("secret-token");
  });

  it("returns no pending invites for viewers", () => {
    expect(publicPendingInvitesForRole("viewer", [inviteRow])).toEqual([]);
  });

  it("returns no pending invites for editors", () => {
    expect(publicPendingInvitesForRole("editor", [inviteRow])).toEqual([]);
  });
});
