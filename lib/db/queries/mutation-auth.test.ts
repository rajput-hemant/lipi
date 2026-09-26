import { describe, expect, it } from "vitest";

import { isWorkspaceMember } from "./mutation-auth";

describe("isWorkspaceMember", () => {
  it("allows the workspace owner", () => {
    expect(
      isWorkspaceMember("owner-id", { workspaceOwnerId: "owner-id" }, []),
    ).toBe(true);
  });

  it("allows collaborators", () => {
    expect(
      isWorkspaceMember(
        "collab-id",
        { workspaceOwnerId: "owner-id" },
        ["collab-id"],
      ),
    ).toBe(true);
  });

  it("denies unrelated users", () => {
    expect(
      isWorkspaceMember("other-id", { workspaceOwnerId: "owner-id" }, []),
    ).toBe(false);
  });
});
