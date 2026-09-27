import { beforeEach, describe, expect, it, vi } from "vitest";

import { searchDocumentsInWorkspace } from "./search";

const { mockRequireUser, mockRequirePermission, mockSelect } = vi.hoisted(
  () => ({
    mockRequireUser: vi.fn(),
    mockRequirePermission: vi.fn(),
    mockSelect: vi.fn(),
  })
);

vi.mock("./mutation-auth", () => ({
  requireAuthenticatedUser: mockRequireUser,
  requireWorkspacePermission: mockRequirePermission,
  MutationAuthError: class MutationAuthError extends Error {},
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: mockSelect,
  },
}));

describe("searchDocumentsInWorkspace", () => {
  const validWorkspaceId = "123e4567-e89b-12d3-a456-426614174000";

  beforeEach(() => {
    mockRequireUser.mockReset();
    mockRequirePermission.mockReset();
    mockSelect.mockReset();
  });

  it("rejects invalid workspace UUID", async () => {
    await expect(
      searchDocumentsInWorkspace("invalid-id", "test")
    ).rejects.toThrow("Invalid workspace ID");
  });

  it("enforces authentication", async () => {
    mockRequireUser.mockRejectedValue(new Error("Unauthorized"));

    await expect(
      searchDocumentsInWorkspace(validWorkspaceId, "test")
    ).rejects.toThrow("Unauthorized");
  });

  it("enforces workspace read permissions", async () => {
    mockRequireUser.mockResolvedValue({ id: "user-1" });
    mockRequirePermission.mockRejectedValue(new Error("Forbidden"));

    await expect(
      searchDocumentsInWorkspace(validWorkspaceId, "test")
    ).rejects.toThrow("Forbidden");

    expect(mockRequirePermission).toHaveBeenCalledWith(
      "user-1",
      validWorkspaceId,
      "document:read"
    );
  });

  it("returns recent documents when query is empty", async () => {
    mockRequireUser.mockResolvedValue({ id: "user-1" });
    mockRequirePermission.mockResolvedValue({ role: "owner" });

    const mockDocs = [
      {
        id: "doc-1",
        workspaceId: validWorkspaceId,
        title: "Home",
        icon: "🏠",
        content: null,
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    const queryBuilder = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockDocs),
    };
    mockSelect.mockReturnValue(queryBuilder);

    const results = await searchDocumentsInWorkspace(validWorkspaceId, "");

    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("doc-1");
    expect(results[0]?.title).toBe("Home");
    expect(results[0]?.icon).toBe("🏠");
  });

  it("searches and extracts snippet when query matches body content", async () => {
    mockRequireUser.mockResolvedValue({ id: "user-1" });
    mockRequirePermission.mockResolvedValue({ role: "editor" });

    const blockContent = JSON.stringify([
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "This document contains details about the project roadmap and milestones.",
          },
        ],
      },
    ]);

    const mockDocs = [
      {
        id: "doc-2",
        workspaceId: validWorkspaceId,
        title: "Specifications",
        icon: "📋",
        content: blockContent,
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    ];

    const queryBuilder = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(mockDocs),
    };
    mockSelect.mockReturnValue(queryBuilder);

    const results = await searchDocumentsInWorkspace(
      validWorkspaceId,
      "roadmap"
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("doc-2");
    expect(results[0]?.snippet).toBeDefined();
    expect(results[0]?.snippet).toContain("roadmap");
  });
});
