import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  authorizeRealtimeRoom,
  RealtimeAuthorizationError,
} from "./authorize-room";

const { findDocument, findWorkspace, findCollaborator } = vi.hoisted(() => ({
  findDocument: vi.fn(),
  findWorkspace: vi.fn(),
  findCollaborator: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      documents: { findFirst: findDocument },
      workspaces: { findFirst: findWorkspace },
      collaborators: { findFirst: findCollaborator },
    },
  },
}));

const workspaceId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const ownerId = "33333333-3333-4333-8333-333333333333";
const editorId = "44444444-4444-4444-8444-444444444444";
const viewerId = "55555555-5555-4555-8555-555555555555";

describe("authorizeRealtimeRoom", () => {
  beforeEach(() => {
    findDocument.mockReset();
    findWorkspace.mockReset();
    findCollaborator.mockReset();
    findDocument.mockResolvedValue({
      id: documentId,
      workspaceId,
      inTrash: false,
    });
    findWorkspace.mockResolvedValue({
      id: workspaceId,
      workspaceOwnerId: ownerId,
      inTrash: false,
    });
  });

  it.each([
    [ownerId, null, "owner", false],
    [editorId, "editor", "editor", false],
    [viewerId, "viewer", "viewer", true],
  ] as const)(
    "grants %s the configured %s room access",
    async (userId, collaboratorRole, role, readOnly) => {
      findCollaborator.mockResolvedValue(
        collaboratorRole ? { role: collaboratorRole } : undefined
      );

      await expect(
        authorizeRealtimeRoom(userId, `document:${documentId}`)
      ).resolves.toMatchObject({ role, readOnly, documentId });
    }
  );

  it.each([
    [ownerId, null, "owner"],
    [editorId, "editor", "editor"],
    [viewerId, "viewer", "viewer"],
  ] as const)(
    "allows %s to read its workspace room",
    async (userId, collaboratorRole, role) => {
      findCollaborator.mockResolvedValue(
        collaboratorRole ? { role: collaboratorRole } : undefined
      );

      await expect(
        authorizeRealtimeRoom(userId, `workspace:${workspaceId}`)
      ).resolves.toMatchObject({ role, readOnly: true, documentId: null });
      expect(findDocument).not.toHaveBeenCalled();
    }
  );

  it("rejects a forged document id that does not resolve in the database", async () => {
    findDocument.mockResolvedValue(undefined);

    await expect(
      authorizeRealtimeRoom(
        ownerId,
        "document:66666666-6666-4666-8666-666666666666"
      )
    ).rejects.toBeInstanceOf(RealtimeAuthorizationError);
  });

  it("rejects a trashed document", async () => {
    findDocument.mockResolvedValue({
      id: documentId,
      workspaceId,
      inTrash: true,
    });

    await expect(
      authorizeRealtimeRoom(ownerId, `document:${documentId}`)
    ).rejects.toBeInstanceOf(RealtimeAuthorizationError);
  });

  it("rejects a valid document id for a non-member", async () => {
    findCollaborator.mockResolvedValue(undefined);

    await expect(
      authorizeRealtimeRoom(
        "77777777-7777-4777-8777-777777777777",
        `document:${documentId}`
      )
    ).rejects.toBeInstanceOf(RealtimeAuthorizationError);
  });

  it("rejects malformed room names before querying the database", async () => {
    await expect(
      authorizeRealtimeRoom(ownerId, `document:${documentId}:forged`)
    ).rejects.toBeInstanceOf(RealtimeAuthorizationError);
    expect(findDocument).not.toHaveBeenCalled();
  });
});
