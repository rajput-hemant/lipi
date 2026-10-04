import { Database } from "@hocuspocus/extension-database";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { describe, expect, it } from "vitest";
import * as Y from "yjs";

import type { RealtimeRoomAccess } from "./context";

import { RealtimeAuthorizationError } from "./context";
import { parseRealtimeRoomName } from "./rooms";
import { createRealtimeServer } from "./server-factory";
import { createRealtimeToken } from "./token";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const documentRoom = `document:${documentId}`;
const otherWorkspaceId = "77777777-7777-4777-8777-777777777777";
const workspaceRoom = `workspace:${workspaceId}`;
const otherWorkspaceRoom = `workspace:${otherWorkspaceId}`;
const ownerId = "33333333-3333-4333-8333-333333333333";
const editorId = "44444444-4444-4444-8444-444444444444";
const viewerId = "55555555-5555-4555-8555-555555555555";
const secret = "realtime-integration-secret";
const allowedOrigins = new Set(["http://localhost:3000"]);

type Peer = {
  document: Y.Doc;
  provider: HocuspocusProvider;
  synced: Promise<void>;
};

function waitUntil(predicate: () => boolean, label: string) {
  return new Promise<void>((resolve, reject) => {
    const startedAt = Date.now();
    const check = () => {
      if (predicate()) {
        resolve();
        return;
      }
      if (Date.now() - startedAt > 5000) {
        reject(new Error(`Timed out waiting for ${label}`));
        return;
      }
      setTimeout(check, 10);
    };
    check();
  });
}

function tokenFor(userId: string, name: string, roomName = documentRoom) {
  return createRealtimeToken({ userId, roomName, name, image: null }, secret);
}

function createPeer(
  url: string,
  userId: string,
  name: string,
  roomName = documentRoom,
  onAuthenticationFailed: (reason: string) => void = () => {},
  onStateless: (payload: string) => void = () => {}
): Peer {
  const document = new Y.Doc();
  let markSynced = () => {};
  const synced = new Promise<void>((resolve) => {
    markSynced = resolve;
  });
  const provider = new HocuspocusProvider({
    url,
    name: roomName,
    document,
    token: tokenFor(userId, name, roomName),
    onAuthenticationFailed: ({ reason }) => onAuthenticationFailed(reason),
    onStateless: ({ payload }) => onStateless(payload),
    onSynced: ({ state }) => {
      if (state) markSynced();
    },
  });

  return { document, provider, synced };
}

function createTestServer(states: Map<string, Uint8Array>) {
  const roles = new Map<string, RealtimeRoomAccess["role"]>([
    [ownerId, "owner"],
    [editorId, "editor"],
    [viewerId, "viewer"],
  ] as const);
  const authorizeRoom = async (
    userId: string,
    roomName: string
  ): Promise<RealtimeRoomAccess> => {
    const room = parseRealtimeRoomName(roomName);
    const role = roles.get(userId);
    if (!room || !role) throw new RealtimeAuthorizationError();
    if (room.kind === "workspace") {
      if (room.id !== workspaceId && room.id !== otherWorkspaceId) {
        throw new RealtimeAuthorizationError();
      }
      return {
        roomName,
        workspaceId: room.id,
        role,
        readOnly: true,
        documentId: null,
      };
    }
    if (room.id !== documentId) throw new RealtimeAuthorizationError();

    return {
      roomName,
      workspaceId,
      role,
      readOnly: role === "viewer",
      documentId,
    };
  };
  const persistence = new Database({
    fetch: async ({ documentName }) => states.get(documentName) ?? null,
    store: async ({ documentName, state }) => {
      states.set(documentName, Uint8Array.from(state));
    },
  });

  return createRealtimeServer({
    address: "127.0.0.1",
    allowedOrigins,
    originIsAllowed: (origin) => origin === null || allowedOrigins.has(origin),
    authorizeRoom,
    extensions: [persistence],
    port: 0,
    debounce: 10,
    maxDebounce: 25,
    secret,
  });
}

describe("Hocuspocus realtime server", () => {
  it("syncs concurrent edits, enforces roles and forged ids, and restores after reconnect", async () => {
    const states = new Map<string, Uint8Array>();
    const servers: ReturnType<typeof createTestServer>[] = [];
    const peers: Peer[] = [];

    try {
      const server = createTestServer(states);
      servers.push(server);
      await server.listen();
      const url = `ws://127.0.0.1:${server.address.port}`;
      const owner = createPeer(url, ownerId, "Owner");
      const editor = createPeer(url, editorId, "Editor");
      peers.push(owner, editor);
      await Promise.all([owner.synced, editor.synced]);

      owner.document.getText("content").insert(0, "owner edit ");
      editor.document.getText("content").insert(0, "editor edit");
      await waitUntil(
        () =>
          owner.document.getText("content").toString() ===
          editor.document.getText("content").toString(),
        "concurrent edits to converge"
      );
      expect(owner.document.getText("content").toString()).toContain(
        "owner edit"
      );
      expect(owner.document.getText("content").toString()).toContain(
        "editor edit"
      );

      editor.provider.setAwarenessField("cursor", { index: 3 });
      await waitUntil(
        () =>
          [...(owner.provider.awareness?.getStates().values() ?? [])].some(
            (state) =>
              state.user?.id === editorId &&
              state.user?.name === "Editor" &&
              state.cursor?.index === 3
          ),
        "authenticated collaborator awareness"
      );

      const viewer = createPeer(url, viewerId, "Viewer");
      peers.push(viewer);
      await viewer.synced;
      expect(viewer.provider.authorizedScope).toBe("readonly");
      expect(viewer.document.getText("content").toString()).toBe(
        owner.document.getText("content").toString()
      );

      viewer.document
        .getText("content")
        .insert(viewer.document.getText("content").length, " viewer edit");
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(
        server.hocuspocus.documents
          .get(documentRoom)
          ?.getText("content")
          .toString()
      ).not.toContain("viewer edit");

      const forgedRoom = "document:66666666-6666-4666-8666-666666666666";
      const forgedFailure = new Promise<string>((resolve) => {
        peers.push(
          createPeer(url, ownerId, "Owner", forgedRoom, (reason) =>
            resolve(reason)
          )
        );
      });
      await expect(forgedFailure).resolves.toBeTruthy();

      await server.hocuspocus.debouncer.executeNow(
        `onStoreDocument-${documentRoom}`
      );
      expect(states.has(documentRoom)).toBe(true);

      for (const peer of peers) peer.provider.destroy();
      peers.length = 0;
      await server.destroy();

      const reconnectedServer = createTestServer(states);
      servers.push(reconnectedServer);
      await reconnectedServer.listen();
      const reconnected = createPeer(
        `ws://127.0.0.1:${reconnectedServer.address.port}`,
        ownerId,
        "Owner"
      );
      peers.push(reconnected);
      await reconnected.synced;
      const restoredContent = reconnected.document
        .getText("content")
        .toString();
      expect(restoredContent).toContain("owner edit");
      expect(restoredContent).toContain("editor edit");
      expect(restoredContent).not.toContain("viewer edit");
    } finally {
      for (const peer of peers) peer.provider.destroy();
      for (const server of servers.reverse()) await server.destroy();
    }
  }, 15000);

  it("relays pages:changed only from editing roles within the sender's workspace", async () => {
    const server = createTestServer(new Map());
    const peers: Peer[] = [];
    const received: Record<string, string[]> = {
      owner: [],
      editor: [],
      viewer: [],
      other: [],
      document: [],
    };
    const join = (key: string, userId: string, room: string): Peer => {
      const peer = createPeer(
        `ws://127.0.0.1:${server.address.port}`,
        userId,
        key,
        room,
        () => {},
        (payload) => received[key].push(payload)
      );
      peers.push(peer);
      return peer;
    };

    try {
      await server.listen();
      const owner = join("owner", ownerId, workspaceRoom);
      const editor = join("editor", editorId, workspaceRoom);
      const viewer = join("viewer", viewerId, workspaceRoom);
      const other = join("other", ownerId, otherWorkspaceRoom);
      const document = join("document", ownerId, documentRoom);
      await Promise.all(
        [owner, editor, viewer, other, document].map((peer) => peer.synced)
      );

      // Messages from a connection arrive in order, so the rejected sends
      // below are all processed before the final accepted one is relayed.
      viewer.provider.sendStateless("pages:changed");
      editor.provider.sendStateless("something:else");
      editor.provider.sendStateless(JSON.stringify({ type: "pages:changed" }));
      document.provider.sendStateless("pages:changed");
      editor.provider.sendStateless("pages:changed");

      await waitUntil(
        () => received.owner.length > 0 && received.viewer.length > 0,
        "accepted workspace notification"
      );
      expect(received.owner).toEqual(["pages:changed"]);
      expect(received.viewer).toEqual(["pages:changed"]);
      expect(received.editor).toEqual([]);
      expect(received.other).toEqual([]);
      expect(received.document).toEqual([]);
    } finally {
      for (const peer of peers) peer.provider.destroy();
      await server.destroy();
    }
  }, 15000);
});
