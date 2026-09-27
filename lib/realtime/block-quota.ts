import { yDocToBlocks } from "@blocknote/core/yjs";
import { messageYjsSyncStep2, messageYjsUpdate } from "y-protocols/sync";
import * as Y from "yjs";

import type { beforeSyncPayload, Connection } from "@hocuspocus/server";

import { assertUserCanCreateBlock } from "@/lib/billing/block-quota";
import { serializeDocumentContent } from "@/lib/block-editor/document-content";
import { realtimeBlockNoteEditor } from "@/lib/block-editor/realtime-schema";
import { DOCUMENT_CONTENT_MAX_LENGTH } from "@/lib/validations/document";
import { BLOCKNOTE_FRAGMENT } from "./constants";
import { parseRealtimeRoomName } from "./rooms";

type BlockNode = { children?: readonly BlockNode[] };

function countBlocks(blocks: readonly BlockNode[]): number {
  return blocks.reduce(
    (count, block) => count + 1 + countBlocks(block.children ?? []),
    0
  );
}

export type RealtimeContext = {
  userId: string;
  name: string;
  image: string | null;
  roomName: string;
  workspaceId: string;
  role: "owner" | "editor" | "viewer";
  readOnly: boolean;
};

export class RealtimeBlockQuotaGuard {
  private readonly pending = new Map<
    string,
    Map<Connection<RealtimeContext>, number>
  >();

  async beforeSync({
    document,
    documentName,
    type,
    payload,
    context,
    connection,
  }: beforeSyncPayload<RealtimeContext>) {
    const room = parseRealtimeRoomName(documentName);
    if (
      !room ||
      room.kind !== "document" ||
      connection.readOnly ||
      (type !== messageYjsSyncStep2 && type !== messageYjsUpdate)
    ) {
      return;
    }

    const currentBlocks = yDocToBlocks(
      realtimeBlockNoteEditor,
      document,
      BLOCKNOTE_FRAGMENT
    );
    const currentCount = countBlocks(currentBlocks);
    const candidate = new Y.Doc();
    Y.applyUpdate(candidate, Y.encodeStateAsUpdate(document));
    Y.applyUpdate(candidate, payload);
    const nextBlocks = yDocToBlocks(
      realtimeBlockNoteEditor,
      candidate,
      BLOCKNOTE_FRAGMENT
    );
    candidate.destroy();

    if (
      serializeDocumentContent(nextBlocks).length > DOCUMENT_CONTENT_MAX_LENGTH
    ) {
      throw new Error("Document content is too large");
    }

    const nextCount = countBlocks(nextBlocks);

    const delta = nextCount - currentCount;
    if (delta <= 0) return;

    const pendingForRoom = this.pending.get(documentName) ?? new Map();
    const pendingDelta = [...pendingForRoom.values()].reduce(
      (total, change) => total + change,
      0
    );
    pendingForRoom.set(connection, delta);
    this.pending.set(documentName, pendingForRoom);

    try {
      await assertUserCanCreateBlock(
        context.userId,
        currentCount + pendingDelta + delta - 1
      );
    } catch (error) {
      this.release(documentName, connection);
      throw error;
    }
  }

  release(documentName: string, connection: Connection<RealtimeContext>) {
    const pendingForRoom = this.pending.get(documentName);
    if (!pendingForRoom) return;

    pendingForRoom.delete(connection);
    if (pendingForRoom.size === 0) this.pending.delete(documentName);
  }
}
