import { describe, expect, it } from "vitest";

import {
  canAddCollaborator,
  canCreateBlock,
  canCreateWorkspace,
  canHoldCollaborators,
  FREE_PLAN_MAX_BLOCKS,
  FREE_PLAN_MAX_COLLABORATORS,
  FREE_PLAN_MAX_WORKSPACES,
} from "./plan-quotas";

describe("plan quotas", () => {
  it("limits free workspaces to one", () => {
    expect(canCreateWorkspace({ isPro: false, ownedWorkspaceCount: 0 })).toBe(
      true
    );
    expect(
      canCreateWorkspace({
        isPro: false,
        ownedWorkspaceCount: FREE_PLAN_MAX_WORKSPACES,
      })
    ).toBe(false);
    expect(canCreateWorkspace({ isPro: true, ownedWorkspaceCount: 10 })).toBe(
      true
    );
  });

  it("limits free collaborators to two", () => {
    expect(canAddCollaborator({ isPro: false, collaboratorCount: 1 })).toBe(
      true
    );
    expect(
      canAddCollaborator({
        isPro: false,
        collaboratorCount: FREE_PLAN_MAX_COLLABORATORS,
      })
    ).toBe(false);
  });

  it("limits free blocks to five hundred", () => {
    expect(canCreateBlock({ isPro: false, blockCount: 499 })).toBe(true);
    expect(
      canCreateBlock({ isPro: false, blockCount: FREE_PLAN_MAX_BLOCKS })
    ).toBe(false);
  });

  it("allows a free owner to hold up to the collaborator cap inclusively", () => {
    const hold = (collaboratorCount: number) =>
      canHoldCollaborators({ isPro: false, collaboratorCount });
    expect(hold(FREE_PLAN_MAX_COLLABORATORS)).toBe(true);
    expect(hold(FREE_PLAN_MAX_COLLABORATORS + 1)).toBe(false);
  });

  it("never limits pro plans", () => {
    expect(canAddCollaborator({ isPro: true, collaboratorCount: 999 })).toBe(
      true
    );
    expect(canHoldCollaborators({ isPro: true, collaboratorCount: 999 })).toBe(
      true
    );
    expect(canCreateBlock({ isPro: true, blockCount: 100000 })).toBe(true);
  });
});
