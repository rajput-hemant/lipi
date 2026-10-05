import { beforeEach, describe, expect, it, vi } from "vitest";

import { PlanQuotaError } from "@/lib/billing/errors";
import { MutationAuthError } from "./mutation-auth";
import { withOwnerCollaboratorLock } from "./workspace-member-quota";

const mocks = vi.hoisted(() => ({
  transaction: {
    execute: vi.fn().mockResolvedValue(undefined),
  },
  runTransaction: vi.fn(),
  assertUserCanAddCollaborator: vi.fn(),
  userHasProPlanEntitlement: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    transaction: mocks.runTransaction,
  },
}));

vi.mock("@/lib/billing/enforce-quotas", () => ({
  assertUserCanAddCollaborator: mocks.assertUserCanAddCollaborator,
}));

vi.mock("@/lib/billing/quota-entitlement", () => ({
  userHasProPlanEntitlement: mocks.userHasProPlanEntitlement,
}));

describe("withOwnerCollaboratorLock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.runTransaction.mockImplementation((work) => work(mocks.transaction));
    mocks.userHasProPlanEntitlement.mockResolvedValue(false);
    mocks.assertUserCanAddCollaborator.mockResolvedValue(undefined);
  });

  it("locks the owner and checks quota in the same transaction as the write", async () => {
    const invite = { workspaceId: "w1", email: "a@b.c" };
    const write = vi.fn().mockResolvedValue("written");

    const result = await withOwnerCollaboratorLock(
      "owner-1",
      async (tx, assertQuota) => {
        await assertQuota(invite);
        return write(tx);
      }
    );

    expect(mocks.transaction.execute).toHaveBeenCalledOnce();
    expect(mocks.assertUserCanAddCollaborator).toHaveBeenCalledWith(
      "owner-1",
      invite,
      { database: mocks.transaction, isPro: false }
    );
    expect(write).toHaveBeenCalledWith(mocks.transaction);
    expect(result).toBe("written");
  });

  it("maps quota errors without running the write", async () => {
    mocks.assertUserCanAddCollaborator.mockRejectedValue(
      new PlanQuotaError("collaborator", "Free plan allows two collaborators.")
    );
    const write = vi.fn();

    await expect(
      withOwnerCollaboratorLock("owner-1", async (_tx, assertQuota) => {
        await assertQuota();
        write();
      })
    ).rejects.toThrow(MutationAuthError);
    expect(write).not.toHaveBeenCalled();
  });
});
