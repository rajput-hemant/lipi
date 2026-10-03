import { describe, expect, it, vi } from "vitest";

import { PlanQuotaError } from "@/lib/billing/errors";
import { MutationAuthError } from "./mutation-auth";
import { ensureOwnerCollaboratorQuota } from "./workspace-member-quota";

const assertUserCanAddCollaborator = vi.fn();

vi.mock("@/lib/billing/enforce-quotas", () => ({
  assertUserCanAddCollaborator: (...args: unknown[]) =>
    assertUserCanAddCollaborator(...args),
}));

describe("ensureOwnerCollaboratorQuota", () => {
  it("forwards the invite so pending invites are counted", async () => {
    assertUserCanAddCollaborator.mockResolvedValue(undefined);
    const invite = { workspaceId: "w1", email: "a@b.c" };

    await ensureOwnerCollaboratorQuota("owner-1", invite);

    expect(assertUserCanAddCollaborator).toHaveBeenCalledWith(
      "owner-1",
      invite
    );
  });

  it("delegates to billing enforcement for the workspace owner", async () => {
    assertUserCanAddCollaborator.mockResolvedValue(undefined);

    await ensureOwnerCollaboratorQuota("owner-1");

    expect(assertUserCanAddCollaborator).toHaveBeenCalledWith(
      "owner-1",
      undefined
    );
  });

  it("maps collaborator plan quota errors to mutation auth errors", async () => {
    assertUserCanAddCollaborator.mockRejectedValue(
      new PlanQuotaError("collaborator", "Free plan allows two collaborators.")
    );

    await expect(ensureOwnerCollaboratorQuota("owner-1")).rejects.toThrow(
      MutationAuthError
    );
    await expect(ensureOwnerCollaboratorQuota("owner-1")).rejects.toThrow(
      "Free plan allows two collaborators."
    );
  });
});
