import { beforeEach, describe, expect, it, vi } from "vitest";

import FilePage from "./page";

const { getCurrentUser, assertDocumentAccess, notFound } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  assertDocumentAccess: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({ notFound, redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentUser }));
vi.mock("@/lib/db/data/mutation-auth", () => ({ assertDocumentAccess }));
vi.mock("@/components/document-editor/document-page-view", () => ({
  DocumentPageView: () => null,
}));

const renderPage = () =>
  FilePage({ params: Promise.resolve({ workspaceId: "ws-1", fileId: "d-1" }) });

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue({ id: "user-1" });
});

describe("FilePage", () => {
  it("renders an active page", async () => {
    assertDocumentAccess.mockResolvedValue({
      id: "d-1",
      workspaceId: "ws-1",
      inTrash: false,
    });

    await expect(renderPage()).resolves.toBeTruthy();
    expect(notFound).not.toHaveBeenCalled();
  });

  it("returns not found for a page in the trash", async () => {
    assertDocumentAccess.mockResolvedValue({
      id: "d-1",
      workspaceId: "ws-1",
      inTrash: true,
    });

    await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("returns not found for a page in another workspace", async () => {
    assertDocumentAccess.mockResolvedValue({
      id: "d-1",
      workspaceId: "ws-2",
      inTrash: false,
    });

    await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
