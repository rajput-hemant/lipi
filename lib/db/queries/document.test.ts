import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteDocumentPermanently,
  duplicateDocument,
  getDocuments,
  restoreDocument,
  softDeleteDocumentTree,
  updateDocument,
} from "./document";
import { MutationAuthError } from "./mutation-auth";

const WORKSPACE_ID = "11111111-1111-4111-8111-111111111111";
const DOCUMENT_ID = "22222222-2222-4222-8222-222222222222";

const mocks = vi.hoisted(() => ({
  assertWorkspaceAccess: vi.fn(),
  authorizeDocumentMutation: vi.fn(),
  requireAuthenticatedUser: vi.fn(),
  workspaceOwnerHasProPlanEntitlement: vi.fn(),
  loadAuthoritativeContent: vi.fn(),
  select: vi.fn(),
  selectRows: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock("@/lib/billing/quota-entitlement", () => ({
  workspaceOwnerHasProPlanEntitlement:
    mocks.workspaceOwnerHasProPlanEntitlement,
}));

vi.mock("@/lib/realtime/authoritative-content", () => ({
  loadAuthoritativeDocumentContentBySourceIds: mocks.loadAuthoritativeContent,
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
  const tx = {
    select: (columns: unknown) => {
      mocks.select(columns);
      return { from: query };
    },
    insert: mocks.insert,
    update: mocks.update,
    delete: mocks.delete,
  };
  return {
    db: {
      ...tx,
      transaction: (fn: (tx: unknown) => unknown) => {
        mocks.transaction();
        return fn(tx);
      },
    },
  };
});

function row(id: string, parentId: string | null) {
  return {
    id,
    workspaceId: WORKSPACE_ID,
    parentId,
    title: "Page",
    icon: "",
    bannerUrl: null,
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
  mocks.workspaceOwnerHasProPlanEntitlement.mockResolvedValue(false);
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

describe("document summary selects", () => {
  it("getDocuments selects every column except content", async () => {
    await getDocuments(WORKSPACE_ID);

    const [columns] = mocks.select.mock.calls[0];
    expect(columns).toHaveProperty("title");
    expect(columns).toHaveProperty("updatedAt");
    expect(columns).not.toHaveProperty("content");
  });

  it("loadWorkspaceDocuments (used by mutations) omits content", async () => {
    mocks.authorizeDocumentMutation.mockResolvedValue({
      user: { id: "user-1" },
      document: row("t", null),
    });
    mocks.selectRows.mockResolvedValue([row("t", null)]);
    mocks.update.mockReturnValue({ set: () => ({ where: () => undefined }) });

    await softDeleteDocumentTree("t");

    expect(mocks.select).toHaveBeenCalledOnce();
    expect(mocks.select.mock.calls[0][0]).not.toHaveProperty("content");
  });
});

describe("duplicateDocument", () => {
  const NEW_ID = "33333333-3333-4333-8333-333333333333";

  it("fetches source content itself and copies it into the new row", async () => {
    mocks.authorizeDocumentMutation.mockResolvedValue({
      user: { id: "user-1" },
      document: row(DOCUMENT_ID, null),
    });
    mocks.selectRows.mockImplementation(async () =>
      "content" in (mocks.select.mock.lastCall?.[0] ?? {}) ?
        [{ id: DOCUMENT_ID, content: "stored body" }]
      : [row(DOCUMENT_ID, null)]
    );
    mocks.loadAuthoritativeContent.mockImplementation(
      async (_ids: string[], fallback: Map<string, string | null>) => fallback
    );
    const values = vi.fn(() => ({
      returning: () => Promise.resolve([row(NEW_ID, null)]),
    }));
    mocks.insert.mockReturnValue({ values });

    await duplicateDocument({ sourceId: DOCUMENT_ID, newId: NEW_ID });

    expect(mocks.select.mock.calls[0][0]).not.toHaveProperty("content");
    expect(mocks.select.mock.calls[1][0]).toHaveProperty("content");
    expect(values).toHaveBeenCalledWith([
      expect.objectContaining({ id: NEW_ID, content: "stored body" }),
    ]);
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
    expect(mocks.workspaceOwnerHasProPlanEntitlement).toHaveBeenCalledWith(
      WORKSPACE_ID
    );
  });

  it("allows the move on a Pro plan", async () => {
    mocks.workspaceOwnerHasProPlanEntitlement.mockResolvedValue(true);
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

describe("restoreDocument root page quota", () => {
  const trashed = { ...row("t", null), inTrash: true };

  beforeEach(() => {
    mocks.authorizeDocumentMutation.mockResolvedValue({
      user: { id: "user-1" },
      document: trashed,
    });
    mocks.selectRows.mockResolvedValue([
      row("a", null),
      row("b", null),
      row("c", null),
      trashed,
    ]);
  });

  it("rejects restoring a root page past the owner's free limit", async () => {
    await expect(restoreDocument("t")).resolves.toMatchObject({
      ok: false,
      code: "INVALID",
      message: expect.stringContaining("Root page limit reached"),
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("restores a root page when the owner is on Pro", async () => {
    mocks.workspaceOwnerHasProPlanEntitlement.mockResolvedValue(true);
    mocks.update.mockReturnValue({ set: () => ({ where: () => undefined }) });

    await expect(restoreDocument("t")).resolves.toEqual({ ok: true, data: 1 });
  });
});

describe("multi-row mutations run in a transaction", () => {
  const trashedRoot = { ...row("t", null), inTrash: true };
  const trashedChild = { ...row("u", "t"), inTrash: true };

  beforeEach(() => {
    mocks.authorizeDocumentMutation.mockResolvedValue({
      user: { id: "user-1" },
      document: trashedRoot,
    });
    mocks.selectRows.mockResolvedValue([trashedRoot, trashedChild]);
  });

  it("deletes the whole subtree with one delete inside the transaction", async () => {
    const where = vi.fn();
    mocks.delete.mockReturnValue({ where });

    await expect(deleteDocumentPermanently("t")).resolves.toEqual({
      ok: true,
      data: 2,
    });

    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.delete).toHaveBeenCalledOnce();
    expect(where).toHaveBeenCalledOnce();
  });

  it("does not delete when the tree read inside the transaction has active descendants", async () => {
    mocks.selectRows.mockResolvedValue([
      trashedRoot,
      { ...trashedChild, inTrash: false },
    ]);

    await expect(deleteDocumentPermanently("t")).resolves.toMatchObject({
      ok: false,
    });
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("trashes the subtree in one transaction", async () => {
    mocks.update.mockReturnValue({ set: () => ({ where: () => undefined }) });

    await expect(softDeleteDocumentTree("t")).resolves.toEqual({
      ok: true,
      data: 2,
    });
    expect(mocks.transaction).toHaveBeenCalledOnce();
  });

  it("passes the transaction executor to the authoritative content loader", async () => {
    mocks.authorizeDocumentMutation.mockResolvedValue({
      user: { id: "user-1" },
      document: row(DOCUMENT_ID, null),
    });
    mocks.selectRows.mockResolvedValue([row(DOCUMENT_ID, null)]);
    mocks.loadAuthoritativeContent.mockResolvedValue(new Map());
    mocks.insert.mockReturnValue({
      values: () => ({ returning: () => Promise.resolve([]) }),
    });

    await duplicateDocument({
      sourceId: DOCUMENT_ID,
      newId: "33333333-3333-4333-8333-333333333333",
    });

    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.loadAuthoritativeContent.mock.calls[0][2]).toHaveProperty(
      "select"
    );
  });
});
