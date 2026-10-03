import { beforeEach, describe, expect, it, vi } from "vitest";

import { getDocuments, updateDocument } from "./document";
import { MutationAuthError } from "./mutation-auth";

const WORKSPACE_ID = "11111111-1111-4111-8111-111111111111";
const DOCUMENT_ID = "22222222-2222-4222-8222-222222222222";

const mocks = vi.hoisted(() => ({
  assertWorkspaceAccess: vi.fn(),
  authorizeDocumentMutation: vi.fn(),
  requireAuthenticatedUser: vi.fn(),
  userHasProPlanEntitlement: vi.fn(),
  selectRows: vi.fn(),
  update: vi.fn(),
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock("@/lib/billing/quota-entitlement", () => ({
  userHasProPlanEntitlement: mocks.userHasProPlanEntitlement,
}));

vi.mock("@/lib/realtime/authoritative-content", () => ({
  loadAuthoritativeDocumentContentBySourceIds: vi.fn(),
}));

vi.mock("./mutation-auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./mutation-auth")>()),
  assertWorkspaceAccess: mocks.assertWorkspaceAccess,
  authorizeDocumentMutation: mocks.authorizeDocumentMutation,
  requireAuthenticatedUser: mocks.requireAuthenticatedUser,
}));

vi.mock("..", () => {
  const query = () => {
    const rows = () => Promise.resolve().then(() => mocks.selectRows());
    return Object.assign(rows(), {
      where: () => Object.assign(rows(), { orderBy: rows }),
    });
  };
  return { db: { select: () => ({ from: query }), update: mocks.update } };
});

function row(id: string, parentId: string | null) {
  return {
    id,
    workspaceId: WORKSPACE_ID,
    parentId,
    title: "Page",
    icon: "",
    bannerUrl: null,
    content: null,
    inTrash: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthenticatedUser.mockResolvedValue({ id: "user-1" });
  mocks.assertWorkspaceAccess.mockResolvedValue({});
  mocks.selectRows.mockResolvedValue([]);
  mocks.userHasProPlanEntitlement.mockResolvedValue(false);
});

describe("getDocuments", () => {
  it("authorizes before the cached loader runs", async () => {
    mocks.assertWorkspaceAccess.mockRejectedValue(
      new MutationAuthError("Forbidden", "FORBIDDEN")
    );

    await expect(getDocuments(WORKSPACE_ID)).rejects.toThrow("Forbidden");
    expect(mocks.selectRows).not.toHaveBeenCalled();
  });
});

describe("updateDocument root page quota", () => {
  beforeEach(() => {
    mocks.authorizeDocumentMutation.mockResolvedValue({
      user: { id: "user-1" },
      document: row(DOCUMENT_ID, "a"),
    });
    mocks.selectRows.mockResolvedValue([
      row("a", null),
      row("b", null),
      row("c", null),
      row(DOCUMENT_ID, "a"),
    ]);
  });

  it("rejects moving a subpage to the root past the free limit", async () => {
    await expect(
      updateDocument({ id: DOCUMENT_ID, parentId: null })
    ).rejects.toThrow("Root page limit reached");
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("allows the move on a Pro plan", async () => {
    mocks.userHasProPlanEntitlement.mockResolvedValue(true);
    mocks.update.mockReturnValue({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([row(DOCUMENT_ID, null)]),
        }),
      }),
    });

    await expect(
      updateDocument({ id: DOCUMENT_ID, parentId: null })
    ).resolves.toMatchObject({ id: DOCUMENT_ID, parentId: null });
  });
});
