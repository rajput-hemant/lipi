import { beforeEach, describe, expect, it, vi } from "vitest";

import { MutationAuthError } from "./mutation-auth";

const { authorizeDocumentMutation, authorizeWorkspaceMutation } = vi.hoisted(
  () => ({
    authorizeDocumentMutation: vi.fn(),
    authorizeWorkspaceMutation: vi.fn(),
  })
);

vi.mock("next/cache", () => ({
  unstable_cache: vi.fn(),
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
vi.mock("./mutation-auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./mutation-auth")>()),
  authorizeDocumentMutation,
  authorizeWorkspaceMutation,
}));

const { createDocument, duplicateDocument, softDeleteDocumentTree } =
  await import("./document");

const forbidden = () => new MutationAuthError("Forbidden", "FORBIDDEN");
const denied = { ok: false, code: "FORBIDDEN" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("document mutations for a forbidden caller", () => {
  it("returns a FORBIDDEN result from createDocument", async () => {
    authorizeWorkspaceMutation.mockRejectedValue(forbidden());

    await expect(
      createDocument({
        id: crypto.randomUUID(),
        workspaceId: crypto.randomUUID(),
        title: "Page",
      })
    ).resolves.toEqual(denied);
  });

  it("returns a FORBIDDEN result from duplicateDocument", async () => {
    authorizeDocumentMutation.mockRejectedValue(forbidden());

    await expect(
      duplicateDocument({
        sourceId: crypto.randomUUID(),
        newId: crypto.randomUUID(),
      })
    ).resolves.toEqual(denied);
  });

  it("returns a FORBIDDEN result from softDeleteDocumentTree", async () => {
    authorizeDocumentMutation.mockRejectedValue(forbidden());

    await expect(softDeleteDocumentTree("doc-1")).resolves.toEqual(denied);
  });

  it("still throws for non-permission failures", async () => {
    authorizeDocumentMutation.mockRejectedValue(new Error("db down"));

    await expect(softDeleteDocumentTree("doc-1")).rejects.toThrow(
      "Failed to move document to trash"
    );
  });
});
