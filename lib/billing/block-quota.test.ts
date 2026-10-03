import { beforeEach, describe, expect, it, vi } from "vitest";

import { assertWorkspaceCanCreateBlock } from "./block-quota";
import { FREE_PLAN_MAX_BLOCKS } from "./plan-quotas";

const mocks = vi.hoisted(() => ({
  workspaceOwnerHasProPlanEntitlement: vi.fn(),
}));

vi.mock("./quota-entitlement", () => ({
  workspaceOwnerHasProPlanEntitlement:
    mocks.workspaceOwnerHasProPlanEntitlement,
}));

describe("assertWorkspaceCanCreateBlock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows the last free block and rejects the next on a Free owner", async () => {
    mocks.workspaceOwnerHasProPlanEntitlement.mockResolvedValue(false);

    await expect(
      assertWorkspaceCanCreateBlock("ws1", FREE_PLAN_MAX_BLOCKS - 1)
    ).resolves.toBeUndefined();
    await expect(
      assertWorkspaceCanCreateBlock("ws1", FREE_PLAN_MAX_BLOCKS)
    ).rejects.toMatchObject({ name: "PlanQuotaError", code: "block" });
    expect(mocks.workspaceOwnerHasProPlanEntitlement).toHaveBeenCalledWith(
      "ws1"
    );
  });

  it("is unlimited when the workspace owner is on Pro", async () => {
    mocks.workspaceOwnerHasProPlanEntitlement.mockResolvedValue(true);

    await expect(
      assertWorkspaceCanCreateBlock("ws1", FREE_PLAN_MAX_BLOCKS * 10)
    ).resolves.toBeUndefined();
  });
});
