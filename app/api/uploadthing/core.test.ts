import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  MutationAuthError,
  WorkspaceNotFoundError,
} from "@/lib/db/data/mutation-auth";
import { ourFileRouter } from "./core";

const { mockGetCurrentUser, mockRequireWorkspacePermission } = vi.hoisted(
  () => ({
    mockGetCurrentUser: vi.fn(),
    mockRequireWorkspacePermission: vi.fn(),
  })
);

vi.mock("@/lib/auth", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

vi.mock("@/lib/db/data/mutation-auth", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/db/data/mutation-auth")>();
  return {
    ...actual,
    requireWorkspacePermission: mockRequireWorkspacePermission,
  };
});

describe("UploadThing core router", () => {
  const validWorkspaceId = "123e4567-e89b-12d3-a456-426614174000";

  beforeEach(() => {
    mockGetCurrentUser.mockReset();
    mockRequireWorkspacePermission.mockReset();
  });

  it("exports documentImage, coverBanner, and workspaceLogo endpoints", () => {
    expect(ourFileRouter.documentImage).toBeDefined();
    expect(ourFileRouter.coverBanner).toBeDefined();
    expect(ourFileRouter.workspaceLogo).toBeDefined();
  });

  describe("documentImage middleware", () => {
    it("rejects unauthenticated requests", async () => {
      mockGetCurrentUser.mockResolvedValue(undefined);

      await expect(
        ourFileRouter.documentImage.middleware({
          input: { workspaceId: validWorkspaceId },
          req: new Request("http://localhost"),
          files: [],
        })
      ).rejects.toMatchObject({ code: "FORBIDDEN", message: "Unauthorized" });
    });

    it("rejects when user lacks document:write permission", async () => {
      mockGetCurrentUser.mockResolvedValue({ id: "user-viewer" });
      mockRequireWorkspacePermission.mockRejectedValue(
        new MutationAuthError("Forbidden", "FORBIDDEN")
      );

      await expect(
        ourFileRouter.documentImage.middleware({
          input: { workspaceId: validWorkspaceId },
          req: new Request("http://localhost"),
          files: [],
        })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Forbidden: insufficient workspace permissions",
      });

      expect(mockRequireWorkspacePermission).toHaveBeenCalledWith(
        "user-viewer",
        validWorkspaceId,
        "document:write"
      );
    });

    it("succeeds and returns metadata for authorized users", async () => {
      mockGetCurrentUser.mockResolvedValue({ id: "user-editor" });
      mockRequireWorkspacePermission.mockResolvedValue({ role: "editor" });

      const metadata = await ourFileRouter.documentImage.middleware({
        input: { workspaceId: validWorkspaceId },
        req: new Request("http://localhost"),
        files: [],
      });

      expect(metadata).toEqual({
        userId: "user-editor",
        workspaceId: validWorkspaceId,
      });
    });

    it("maps a missing workspace to NOT_FOUND", async () => {
      mockGetCurrentUser.mockResolvedValue({ id: "user-editor" });
      mockRequireWorkspacePermission.mockRejectedValue(
        new WorkspaceNotFoundError()
      );

      await expect(
        ourFileRouter.documentImage.middleware({
          input: { workspaceId: validWorkspaceId },
          req: new Request("http://localhost"),
          files: [],
        })
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Workspace not found",
      });
    });

    it("rethrows unexpected failures instead of mapping to FORBIDDEN", async () => {
      mockGetCurrentUser.mockResolvedValue({ id: "user-editor" });
      mockRequireWorkspacePermission.mockRejectedValue(
        new Error("Database offline")
      );

      await expect(
        ourFileRouter.documentImage.middleware({
          input: { workspaceId: validWorkspaceId },
          req: new Request("http://localhost"),
          files: [],
        })
      ).rejects.toThrow("Database offline");
    });
  });

  describe("coverBanner middleware", () => {
    it("requires document:write permission", async () => {
      mockGetCurrentUser.mockResolvedValue({ id: "user-editor" });
      mockRequireWorkspacePermission.mockResolvedValue({ role: "editor" });

      const metadata = await ourFileRouter.coverBanner.middleware({
        input: { workspaceId: validWorkspaceId },
        req: new Request("http://localhost"),
        files: [],
      });

      expect(metadata).toEqual({
        userId: "user-editor",
        workspaceId: validWorkspaceId,
      });
      expect(mockRequireWorkspacePermission).toHaveBeenCalledWith(
        "user-editor",
        validWorkspaceId,
        "document:write"
      );
    });
  });

  describe("workspaceLogo middleware", () => {
    it("requires workspace:settings permission", async () => {
      mockGetCurrentUser.mockResolvedValue({ id: "user-owner" });
      mockRequireWorkspacePermission.mockResolvedValue({ role: "owner" });

      const metadata = await ourFileRouter.workspaceLogo.middleware({
        input: { workspaceId: validWorkspaceId },
        req: new Request("http://localhost"),
        files: [],
      });

      expect(metadata).toEqual({
        userId: "user-owner",
        workspaceId: validWorkspaceId,
      });
      expect(mockRequireWorkspacePermission).toHaveBeenCalledWith(
        "user-owner",
        validWorkspaceId,
        "workspace:settings"
      );
    });

    it("rejects non-owners without workspace:settings permission", async () => {
      mockGetCurrentUser.mockResolvedValue({ id: "user-editor" });
      mockRequireWorkspacePermission.mockRejectedValue(
        new MutationAuthError("Forbidden", "FORBIDDEN")
      );

      await expect(
        ourFileRouter.workspaceLogo.middleware({
          input: { workspaceId: validWorkspaceId },
          req: new Request("http://localhost"),
          files: [],
        })
      ).rejects.toThrow("Forbidden: insufficient workspace permissions");
    });
  });

  describe("onUploadComplete callbacks", () => {
    it("returns uploaded file URL and metadata", async () => {
      const res = await ourFileRouter.documentImage.onUploadComplete({
        metadata: { userId: "user-1", workspaceId: validWorkspaceId },
        file: {
          key: "sample.png",
          name: "sample.png",
          size: 1024,
          type: "image/png",
          customId: null,
          url: "https://example.com/fallback.png",
          ufsUrl: "https://utfs.io/f/sample.png",
        },
      });

      expect(res).toEqual({
        uploadedBy: "user-1",
        workspaceId: validWorkspaceId,
        url: "https://utfs.io/f/sample.png",
      });
    });
  });
});
