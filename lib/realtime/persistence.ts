import { blocksToYDoc, yDocToBlocks } from "@blocknote/core/yjs";
import { Database } from "@hocuspocus/extension-database";
import { and, eq } from "drizzle-orm";
import * as Y from "yjs";

import type { RealtimeBlockEditorSchema } from "@/lib/block-editor/realtime-schema";

import {
  getStoredDocumentContentState,
  serializeDocumentContent,
} from "@/lib/block-editor/document-content";
import { realtimeBlockNoteEditor } from "@/lib/block-editor/realtime-schema";
import { db } from "@/lib/db";
import { documents, realtimeDocuments } from "@/lib/db/schema";
import { DOCUMENT_CONTENT_MAX_LENGTH } from "@/lib/validations/document";
import { BLOCKNOTE_FRAGMENT } from "./constants";
import { parseRealtimeRoomName } from "./rooms";

export function createRealtimePersistence() {
  return new Database({
    fetch: async ({ documentName }) => {
      const room = parseRealtimeRoomName(documentName);
      if (!room || room.kind !== "document") return null;

      const saved = await db.query.realtimeDocuments.findFirst({
        where: eq(realtimeDocuments.documentId, room.id),
      });
      if (saved) return saved.state;

      const [document] = await db
        .select({
          id: documents.id,
          content: documents.content,
          inTrash: documents.inTrash,
        })
        .from(documents)
        .where(eq(documents.id, room.id))
        .limit(1);

      if (!document || document.inTrash) {
        throw new Error("Document is unavailable");
      }

      const content = getStoredDocumentContentState<
        RealtimeBlockEditorSchema["blockSchema"],
        RealtimeBlockEditorSchema["inlineContentSchema"],
        RealtimeBlockEditorSchema["styleSchema"]
      >(document.content);
      if (content.status === "corrupt") {
        throw new Error("Stored document content is invalid");
      }

      const initialDoc = blocksToYDoc(
        realtimeBlockNoteEditor,
        content.status === "ready" ? content.blocks : [],
        BLOCKNOTE_FRAGMENT
      );
      const state = Y.encodeStateAsUpdate(initialDoc);
      initialDoc.destroy();

      await db
        .insert(realtimeDocuments)
        .values({ documentId: room.id, state })
        .onConflictDoNothing({ target: realtimeDocuments.documentId });

      const initialized = await db.query.realtimeDocuments.findFirst({
        where: eq(realtimeDocuments.documentId, room.id),
      });

      return initialized?.state ?? state;
    },
    store: async ({ documentName, state }) => {
      const room = parseRealtimeRoomName(documentName);
      if (!room || room.kind !== "document") return;

      const ydoc = new Y.Doc();
      Y.applyUpdate(ydoc, state);
      const blocks = yDocToBlocks(
        realtimeBlockNoteEditor,
        ydoc,
        BLOCKNOTE_FRAGMENT
      );
      ydoc.destroy();

      const content = serializeDocumentContent(blocks);
      if (content.length > DOCUMENT_CONTENT_MAX_LENGTH) {
        throw new Error("Document content is too large");
      }

      const updatedAt = new Date().toISOString();
      await db.transaction(async (transaction) => {
        const [document] = await transaction
          .select({ id: documents.id, inTrash: documents.inTrash })
          .from(documents)
          .where(eq(documents.id, room.id))
          .for("update")
          .limit(1);

        if (!document || document.inTrash) {
          throw new Error("Document is unavailable");
        }

        await transaction
          .insert(realtimeDocuments)
          .values({ documentId: room.id, state, updatedAt })
          .onConflictDoUpdate({
            target: realtimeDocuments.documentId,
            set: { state, updatedAt },
          });

        const [updated] = await transaction
          .update(documents)
          .set({ content, updatedAt })
          .where(and(eq(documents.id, room.id), eq(documents.inTrash, false)))
          .returning({ id: documents.id });

        if (!updated) throw new Error("Document is unavailable");
      });
    },
  });
}
