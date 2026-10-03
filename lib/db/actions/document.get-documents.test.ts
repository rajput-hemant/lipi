import { beforeEach, describe, expect, it, vi } from "vitest";

import { MutationAuthError } from "../data/mutation-auth";

const { cache, requireAuthenticatedUser, assertWorkspaceAccess } = vi.hoisted(
  () => ({
    cache: vi.fn(),
    requireAuthenticatedUser: vi.fn(),
    assertWorkspaceAccess: vi.fn(),
  })
);

vi.mock("next/cache", () => ({
  unstable_cache: cache,
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));
vi.mock("..", () => ({ db: {} }));
vi.mock("@/lib/billing/quota-entitlement", () => ({
  workspaceOwnerHasProPlanEntitlement: vi.fn(),
}));
vi.mock("@/lib/realtime/authoritative-content", () => ({
  loadAuthoritativeDocumentContentBySourceIds: vi.fn(),
}));
vi.mock("../data/mutation-auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../data/mutation-auth")>()),
  requireAuthenticatedUser,
  assertWorkspaceAccess,
}));

const { getDocuments } = await import("./document");

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("getDocuments", () => {
  it("authorizes the caller before reading the shared cache", async () => {
    requireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    assertWorkspaceAccess.mockRejectedValue(
      new MutationAuthError("Forbidden", "FORBIDDEN")
    );

    await expect(getDocuments(crypto.randomUUID())).rejects.toThrow(
      "Forbidden"
    );
    expect(cache).not.toHaveBeenCalled();
  });
});
